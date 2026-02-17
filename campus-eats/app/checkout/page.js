'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../lib/firebase'; 
import { collection, doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronLeft, Plus, Minus, Camera, Check } from 'lucide-react';

export default function Checkout() {
  const [cart, setCart] = useState([]);
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

  // FIXED: Total calculation multiplying by quantity
  const total = useMemo(() => {
    if (!cart || cart.length === 0) return 0;
    return cart.reduce((sum, item) => {
      const price = Number(item.price || item.Price || 0);
      const qty = Number(item.quantity || 1);
      return sum + (price * qty);
    }, 0);
  }, [cart]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('pending_cart', JSON.stringify(cart));
    localStorage.setItem('pending_total', total.toString());
    // Ensure all three variables are present and stay present
  }, [cart, isHydrated, total]);

  // FIXED: Handlers to maintain quantity-based structure
  const addItem = (itemId) => {
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: (item.quantity || 1) + 1 } : item
    ));
  };

  const removeItem = (itemId) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          return { ...item, quantity: (item.quantity || 1) - 1 };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

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
    if (cart.length === 0 || !shopId) return alert("Your cart is empty or shop is invalid.");
    
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
          items: cart, // Now correctly contains {name, price, quantity}
          total: total,
          status: "AWAITING_PAYMENT",
          createdAt: serverTimestamp(),
          shopId: shopId 
        });
        
        return { docId: newOrderRef.id, numericId: nextId };
      });

      setGeneratedUpiLink(`upi://pay?pa=ayush12123a@okhdfcbank&pn=CampusEats&am=${total}&cu=INR&tn=Order-${newOrderData.numericId}`);
      setLastCreatedOrderId(newOrderData.docId);
      setShowPaymentOptions(true);
      // Don't clear cart from localStorage until screenshot is submitted to prevent loss if app crashes
    } catch (e) { 
      alert("Permission Error: Please ensure you are logged in or Firestore rules are open.");
      console.error(e);
    }
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
      localStorage.removeItem('pending_cart');
      router.push(`/status/${lastCreatedOrderId}`);
    } catch (e) { alert("Upload failed"); } finally { setIsUploading(false); }
  };

  if (!isHydrated) return null;

  return (
    <div className="max-w-md mx-auto p-6 min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <button onClick={() => router.back()} className="mb-4 text-orange-600 font-bold uppercase text-xs flex items-center gap-1 hover:gap-2 transition-all">
        <ChevronLeft size={14}/> Add More
      </button>
      
      <h1 className="text-3xl font-black mb-6 dark:text-white tracking-tight uppercase">Checkout</h1>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 shadow-sm mb-6 border border-gray-100 dark:border-gray-800">
        {cart.length === 0 ? (
          <p className="text-center py-6 text-gray-400 font-bold">Cart is empty</p>
        ) : (
          <div className="space-y-4 mb-6">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="flex-1">
                  <h3 className="font-bold dark:text-white">{item.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">₹{item.price || item.Price} Each</p>
                </div>
                
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-2xl mr-4">
                  <button onClick={() => removeItem(item.id)} className="text-orange-600 active:scale-125 transition-transform"><Minus size={16} /></button>
                  <span className="text-sm font-black dark:text-white w-4 text-center">{item.quantity}</span>
                  <button onClick={() => addItem(item.id)} className="text-green-600 active:scale-125 transition-transform"><Plus size={16} /></button>
                </div>

                <div className="text-right font-black dark:text-white min-w-[60px]">
                  ₹{Number(item.price || item.Price) * (item.quantity || 1)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t-2 dark:border-gray-800">
          <span className="text-xl font-black dark:text-white uppercase tracking-tighter">Total</span>
          <span className="text-2xl font-black text-orange-600">₹{total}</span>
        </div>
      </div>

      <button onClick={handleFinalPayment} disabled={cart.length === 0} className="w-full bg-orange-600 text-white p-5 rounded-3xl font-black shadow-xl uppercase active:scale-[0.98] transition-all disabled:opacity-50">
        PROCEED TO PAY
      </button>

      {/* Payment Modal remains the same */}
      {showPaymentOptions && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[3rem] p-8 pb-12 animate-in slide-in-from-bottom duration-500">
            <h2 className="text-2xl font-black text-center mb-6 dark:text-white uppercase tracking-tighter">Complete Payment</h2>
            <div className="space-y-6">
              <button onClick={() => window.location.href = generatedUpiLink} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all">OPEN UPI APP</button>
              <div className="flex justify-center bg-white p-4 rounded-3xl border border-gray-100"><QRCodeSVG value={generatedUpiLink} size={140} /></div>
              <div className="pt-6 border-t dark:border-gray-800">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {screenshot ? <Check className="text-green-500 mb-2" size={32} /> : <Camera className="text-gray-400 mb-2" size={32} />}
                  <p className="text-xs font-black text-gray-500 uppercase">{screenshot ? "Screenshot Attached" : "Upload Payment Screenshot"}</p>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setScreenshot(e.target.files[0])} />
                </label>
              </div>
              <button onClick={handleSubmitScreenshot} disabled={!screenshot || isUploading} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 uppercase text-xs">
                {isUploading ? "UPLOADING..." : "VERIFY & FINALIZE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}