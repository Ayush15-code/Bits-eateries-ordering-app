'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, storage } from '../lib/firebase'; 
import { 
  collection, doc, runTransaction, serverTimestamp, updateDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { QRCodeSVG } from 'qrcode.react';

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [shopId, setShopId] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [generatedUpiLink, setGeneratedUpiLink] = useState('');
  const [lastCreatedOrderId, setLastCreatedOrderId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('pending_cart') || '[]');
    const savedShopId = localStorage.getItem('pending_shop_id') || '';
    setCart(savedCart);
    setShopId(savedShopId);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const newTotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    setTotal(newTotal);
    localStorage.setItem('pending_cart', JSON.stringify(cart));
  }, [cart, isHydrated]);

  const groupedItems = cart.reduce((acc, item) => {
    const itemId = item.id || item.itemName || item.name;
    const existing = acc.find(i => (i.id || i.itemName || i.name) === itemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      acc.push({ ...item, quantity: 1, displayName: item.itemName || item.name });
    }
    return acc;
  }, []);

  const addItem = (item) => {
    const { quantity, displayName, ...originalItem } = item;
    setCart(prev => [...prev, originalItem]);
  };

  const removeItem = (targetId) => {
    const index = cart.findIndex(item => (item.id || item.itemName || item.name) === targetId);
    if (index > -1) {
      const newCart = [...cart];
      newCart.splice(index, 1);
      setCart(newCart);
    }
  };

  const handleFinalPayment = async () => {
    if (cart.length === 0) return;
    
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const counterRef = doc(db, "internal", "order_counter");
      const ordersCol = collection(db, "orders");

      const newOrderData = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        
        let nextId = 1;
        if (counterSnap.exists()) {
          const data = counterSnap.data();
          if (data.lastDate === todayStr) {
            nextId = (data.currentCount || 0) + 1;
          }
        }

        // Initialize or update counter
        transaction.set(counterRef, { 
          currentCount: nextId, 
          lastDate: todayStr 
        }, { merge: true });

        const newOrderRef = doc(ordersCol);
        transaction.set(newOrderRef, {
          orderId: nextId,
          items: cart,
          total: total,
          status: "AWAITING_PAYMENT",
          createdAt: serverTimestamp(),
          // CRITICAL: Fallback shopId to prevent transaction failure
          shopId: shopId || "unknown_shop" 
        });

        return { docId: newOrderRef.id, numericId: nextId };
      });

      const upi = `upi://pay?pa=tushar.nandal678@okhdfcbank&pn=CampusEats&am=${total}&cu=INR&tn=Order-${newOrderData.numericId}&tr=${newOrderData.docId}&mc=5411`;
      setGeneratedUpiLink(upi);
      setLastCreatedOrderId(newOrderData.docId);
      setShowPaymentOptions(true);
      
      localStorage.removeItem('pending_cart');
    } catch (e) {
      console.error("Order Error:", e);
      alert(`Order failed: ${e.message}. Check if your Firestore 'internal/order_counter' exists.`);
    }
  };

  const handleSubmitScreenshot = async () => {
    if (!screenshot) return alert("Please select a screenshot first!");
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `screenshots/${lastCreatedOrderId}`);
      await uploadBytes(storageRef, screenshot);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "orders", lastCreatedOrderId), {
        screenshotUrl: downloadURL,
        status: "AWAITING_VERIFICATION"
      });

      router.push(`/status/${lastCreatedOrderId}`);
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Upload failed. Make sure Storage is enabled in Firebase Console.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isHydrated) return null;

  return (
    <div className="max-w-md mx-auto p-6 min-h-screen bg-gray-50 dark:bg-gray-950">
      <button onClick={() => router.back()} className="mb-4 text-orange-600 font-bold hover:underline">
        ← Add More Items
      </button>

      <h1 className="text-3xl font-black mb-6 dark:text-white">Checkout</h1>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 shadow-sm mb-6 border border-gray-100 dark:border-gray-800">
        {groupedItems.length === 0 ? (
          <p className="text-center py-10 text-gray-400">Your cart is empty</p>
        ) : (
          <div className="space-y-4">
            {groupedItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="flex-1">
                  <h3 className="font-bold dark:text-white">{item.displayName}</h3>
                  <p className="text-xs text-gray-400">₹{item.price} each</p>
                </div>
                
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-2xl mr-4">
                  <button onClick={() => removeItem(item.id || item.itemName || item.name)} className="text-orange-600 font-black px-1"> − </button>
                  <span className="text-sm font-black dark:text-white">{item.quantity}</span>
                  <button onClick={() => addItem(item)} className="text-green-600 font-black px-1"> + </button>
                </div>

                <div className="text-right font-black dark:text-white w-16">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-6 pt-6 border-t dark:border-gray-800">
          <span className="text-xl font-black dark:text-white">Total</span>
          <span className="text-xl font-black text-orange-600">₹{total}</span>
        </div>
      </div>

      <button 
        onClick={handleFinalPayment} 
        disabled={cart.length === 0}
        className="w-full bg-green-600 text-white p-5 rounded-[2rem] font-black shadow-xl active:scale-95 transition-all disabled:opacity-50"
      >
        Pay ₹{total}
      </button>

      {showPaymentOptions && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[3rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black text-center mb-6 dark:text-white">Verify Payment</h2>
            <div className="space-y-6">
              <button onClick={() => window.location.href = generatedUpiLink} className="w-full bg-orange-600 text-white p-4 rounded-2xl font-black">
                📱 Open UPI App
              </button>
              <div className="flex justify-center bg-white p-4 rounded-3xl border-2 border-gray-50">
                <QRCodeSVG value={generatedUpiLink} size={160} />
              </div>
              <div className="border-t dark:border-gray-800 pt-6">
                <p className="text-[10px] font-black text-blue-600 uppercase mb-3 text-center tracking-widest">Upload Screenshot</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setScreenshot(e.target.files[0])} 
                  className="block w-full text-xs text-gray-500"
                />
              </div>
              <button 
                onClick={handleSubmitScreenshot} 
                disabled={!screenshot || isUploading}
                className="w-full bg-black dark:bg-white dark:text-black text-white py-5 rounded-2xl font-black disabled:opacity-30 uppercase tracking-widest text-sm"
              >
                {isUploading ? "Uploading..." : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}