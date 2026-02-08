'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../lib/firebase'; 
import { collection, doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronLeft, Plus, Minus, Camera, Check, Loader2 } from 'lucide-react';

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
    // Keep localStorage in sync if we add/remove items here
    localStorage.setItem('pending_cart', JSON.stringify(cart));
  }, [cart, isHydrated]);

  // --- ADD/MINUS LOGIC ---
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
    // Strip quantity/displayName to keep the raw item structure
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

  // --- COMPRESSION ENGINE (UNTOUCHED) ---
  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            const readerBase64 = new FileReader();
            readerBase64.readAsDataURL(blob);
            readerBase64.onloadend = () => resolve(readerBase64.result);
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleFinalPayment = async () => {
    if (cart.length === 0 || !shopId) return alert("Select an eatery first!");
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const counterRef = doc(db, "internal", "order_counter");
      const ordersCol = collection(db, "orders");

      const newOrderData = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        let nextId = 1;
        if (counterSnap.exists() && counterSnap.data().lastDate === todayStr) {
          nextId = (counterSnap.data().currentCount || 0) + 1;
        }
        transaction.set(counterRef, { currentCount: nextId, lastDate: todayStr }, { merge: true });
        const newOrderRef = doc(ordersCol);
        transaction.set(newOrderRef, {
          orderId: nextId,
          items: cart,
          total: total,
          status: "AWAITING_PAYMENT",
          createdAt: serverTimestamp(),
          shopId: shopId 
        });
        return { docId: newOrderRef.id, numericId: nextId };
      });

      setGeneratedUpiLink(`upi://pay?pa=tushar.nandal678@okhdfcbank&pn=CampusEats&am=${total}&cu=INR&tn=Order-${newOrderData.numericId}&tr=${newOrderData.docId}`);
      setLastCreatedOrderId(newOrderData.docId);
      setShowPaymentOptions(true);
      localStorage.removeItem('pending_cart');
    } catch (e) { alert(e.message); }
  };

  const handleSubmitScreenshot = async () => {
    if (!screenshot) return alert("Upload screenshot!");
    setIsUploading(true);
    try {
      const base64String = await compressImage(screenshot);
      await updateDoc(doc(db, "orders", lastCreatedOrderId), {
        screenshotBase64: base64String,
        status: "AWAITING_VERIFICATION"
      });
      const history = JSON.parse(localStorage.getItem('order_history') || '[]');
      localStorage.setItem('order_history', JSON.stringify([...history, lastCreatedOrderId]));
      router.push(`/status/${lastCreatedOrderId}`);
    } catch (e) { alert("Upload failed"); } finally { setIsUploading(false); }
  };

  if (!isHydrated) return null;

  return (
    <div className="max-w-md mx-auto p-6 min-h-screen bg-gray-50 dark:bg-gray-950">
      <button onClick={() => router.back()} className="mb-4 text-orange-600 font-bold tracking-tight uppercase text-xs flex items-center gap-1">
        <ChevronLeft size={14}/> Add More
      </button>
      
      <h1 className="text-3xl font-black mb-6 dark:text-white tracking-tight">Checkout</h1>

      {/* --- CART ITEMS SECTION --- */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 shadow-sm mb-6 border border-gray-100 dark:border-gray-800">
        {groupedItems.length === 0 ? (
          <p className="text-center py-6 text-gray-400 font-bold">Cart is empty</p>
        ) : (
          <div className="space-y-4 mb-6">
            {groupedItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0 last:pb-0">
                <div className="flex-1">
                  <h3 className="font-bold dark:text-white">{item.displayName}</h3>
                  <p className="text-[10px] text-gray-400 font-bold tracking-widest">₹{item.price} EACH</p>
                </div>
                
                {/* Add/Minus Controls */}
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-2xl mr-4">
                  <button 
                    onClick={() => removeItem(item.id || item.itemName || item.name)} 
                    className="text-orange-600 hover:scale-110 active:scale-90 transition-transform"
                  >
                    <Minus size={16} strokeWidth={3} />
                  </button>
                  <span className="text-sm font-black dark:text-white w-4 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => addItem(item)} 
                    className="text-green-600 hover:scale-110 active:scale-90 transition-transform"
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>

                <div className="text-right font-black dark:text-white min-w-[50px]">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t-2 border-gray-50 dark:border-gray-800">
          <span className="text-xl font-black dark:text-white uppercase">Total</span>
          <span className="text-2xl font-black text-orange-600">₹{total}</span>
        </div>
      </div>

      <button 
        onClick={handleFinalPayment} 
        disabled={cart.length === 0}
        className="w-full bg-orange-600 text-white p-5 rounded-3xl font-black shadow-xl active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
      >
        PROCEED TO PAY
      </button>

      {showPaymentOptions && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-0 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-[3rem] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-8" />
            <h2 className="text-2xl font-black text-center mb-6 dark:text-white uppercase tracking-tight">Complete Payment</h2>
            <div className="space-y-6">
              <button onClick={() => window.location.href = generatedUpiLink} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg">OPEN UPI APP</button>
              <div className="flex justify-center bg-white p-4 rounded-3xl border-4 border-gray-50"><QRCodeSVG value={generatedUpiLink} size={140} /></div>
              <div className="pt-6 border-t dark:border-gray-800">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                  {screenshot ? <Check className="text-green-500 mb-2" /> : <Camera className="text-gray-400 mb-2" />}
                  <p className="text-xs font-black text-gray-500 uppercase">{screenshot ? "Attached" : "Upload Screenshot"}</p>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setScreenshot(e.target.files[0])} />
                </label>
              </div>
              <button onClick={handleSubmitScreenshot} disabled={!screenshot || isUploading} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black disabled:opacity-30">
                {isUploading ? "UPLOADING..." : "VERIFY & FINALIZE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}