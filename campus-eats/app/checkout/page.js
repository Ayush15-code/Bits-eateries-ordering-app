'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '../lib/firebase';
import {
  collection, doc, runTransaction, serverTimestamp, updateDoc, getDoc // Added getDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronLeft, Trash2, Camera, Loader2, Smartphone, Plus, Minus, ReceiptText } from 'lucide-react';

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [shopId, setShopId] = useState('');
  const [shop, setShop] = useState(null); // Added shop state
  const [user, setUser] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [generatedUpiLinks, setGeneratedUpiLinks] = useState({
  phonepe: '', gpay: '', paytm: '', default: ''
});
  const [generatedUpiLink, setGeneratedUpiLink] = useState('');
  const [lastCreatedOrderId, setLastCreatedOrderId] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [lastNumericId, setLastNumericId] = useState(null);
  const [deviceType, setDeviceType] = useState('android');
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/login');
      else setUser(u);
    });

    try {
      const savedCart = JSON.parse(localStorage.getItem('pending_cart') || '[]');
      const savedShopId = localStorage.getItem('pending_shop_id') || '';
      setCart(savedCart);
      setShopId(savedShopId);
      setIsHydrated(true);
    } catch (err) {
      setIsHydrated(true);
    }
    return () => unsub();
  }, [router]);

  // --- NEW: Fetch Shop Data for Dynamic UPI ---
  useEffect(() => {
    if (!shopId) return;
    const fetchShopData = async () => {
      try {
        const shopRef = doc(db, "shops", shopId);
        const shopSnap = await getDoc(shopRef);
        if (shopSnap.exists()) {
          setShop(shopSnap.data());
        }
      } catch (err) {
        console.error("Error fetching shop:", err);
      }
    };
    fetchShopData();
  }, [shopId]);

  useEffect(() => {
    if (!isHydrated) return;
    const newTotal = cart.reduce((sum, item) => sum + (Number(item.price || item.Price || 0) * (item.quantity || 1)), 0);
    setTotal(newTotal);
    localStorage.setItem('pending_cart', JSON.stringify(cart));
  }, [cart, isHydrated]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800;
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          setScreenshotBase64(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const updateQty = (index, delta) => {
    const newCart = [...cart];
    const newQty = (newCart[index].quantity || 1) + delta;
    if (newQty > 0) {
      newCart[index].quantity = newQty;
      setCart(newCart);
    } else {
      removeItem(index);
    }
  };

  const removeItem = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

const handleFinalPayment = async () => {
  if (cart.length === 0) return;

  // iOS Detection: Navigator platform ko replace kiya safer regex se
  const userAgent = window.navigator.userAgent || window.navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));

  const verificationCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  const merchantUpi = shop?.upiId || "ayush12123a@okhdfcbank"; 
  const merchantName = shop?.name || "CampusEats";

  // Links ko transaction se pehle prepare kar lo taaki state foran set ho jaye
  const transactionRef = `TR${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const baseParams = `pa=${merchantUpi}&pn=${encodeURIComponent(merchantName)}&am=${total}&cu=INR&tn=Order${verificationCode}&mc=5499&mode=02&purpose=00&tr=${transactionRef}`;
  
  // States update karein transaction se PEHLE taaki UI crash na ho
  if (isIOS) {
    setDeviceType('ios');
    setGeneratedUpiLinks({
      phonepe: `phonepe://pay?${baseParams}`,
      gpay: `googlegpay://pay?${baseParams}`,
      paytm: `paytmmp://pay?${baseParams}`,
      default: `upi://pay?${baseParams}`
    });
  } else {
    setDeviceType('android');
    setGeneratedUpiLink(`upi://pay?${baseParams}`);
  }

  // Ab Modal kholo
  setShowPaymentOptions(true);
  setIsUploading(true);

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const counterRef = doc(db, "internal", "order_counter");
    const ordersCol = collection(db, "orders");

    const newOrderData = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let nextId = 1;
      if (counterSnap.exists()) {
        const data = counterSnap.data();
        if (data.lastDate === todayStr) { nextId = data.currentCount + 1; }
      }
      transaction.set(counterRef, { currentCount: nextId, lastDate: todayStr }, { merge: true });

      const newOrderRef = doc(ordersCol);
      transaction.set(newOrderRef, {
        orderId: nextId,
        userId: user?.uid || "unknown",
        userName: auth.currentUser?.displayName || "BITS Student",
        items: cart,
        total: total,
        verificationCode: verificationCode,
        status: "PENDING_SCREENSHOT",
        createdAt: serverTimestamp(),
        shopId: shopId
      });
      return { docId: newOrderRef.id, numericId: nextId };
    });

    setLastCreatedOrderId(newOrderData.docId);
    setLastNumericId(newOrderData.numericId);
    setIsUploading(false);

  } catch (e) {
    console.error("Payment Error: ", e);
    setIsUploading(false);
    setShowPaymentOptions(false);
    alert("Order failed. Please try again.");
  }
};

  const handleSubmitScreenshot = async () => {
    if (!screenshotBase64 || !lastCreatedOrderId) return;
    setIsUploading(true);
    try {
      await updateDoc(doc(db, "orders", lastCreatedOrderId), {
        screenshotBase64: screenshotBase64,
        status: "AWAITING_VERIFICATION",
        submittedAt: serverTimestamp()
      });

      const activeOrder = {
        id: lastCreatedOrderId,
        orderId: lastNumericId || "...",
        total: total,
        items: cart, // Added items here to fix your earlier issue
        status: "AWAITING_VERIFICATION",
        timestamp: Date.now()
      };

      const existingHistory = JSON.parse(localStorage.getItem('order_history_v2') || '[]');
      localStorage.setItem('order_history_v2', JSON.stringify([activeOrder, ...existingHistory]));

      localStorage.removeItem('pending_cart');
      router.push(`/status/${lastCreatedOrderId}`);

    } catch (error) {
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isHydrated) return null;

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-[#050505] min-h-screen text-gray-900 dark:text-white transition-colors">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => router.back()} className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 active:scale-90 transition-all shadow-sm">
          <ChevronLeft size={20} className="text-orange-600" />
        </button>
        <h1 className="text-xl font-black uppercase italic tracking-tighter">Review Order</h1>
        <div className="w-11"></div>
      </div>

      <div className="space-y-4 mb-8">
        {cart.length === 0 ? (
          <div className="text-center py-20 opacity-20 font-black uppercase text-xs tracking-widest">Cart is empty</div>
        ) : (
          cart.map((item, index) => (
            <div key={index} className="bg-white dark:bg-white/5 p-5 rounded-[2rem] border border-gray-100 dark:border-white/10 flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="bg-orange-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm italic shadow-lg shadow-orange-600/20 text-white">
                    {item.quantity || 1}x
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase italic tracking-tight">{item.name || item.itemName}</p>
                    <p className="text-orange-500 font-black text-[10px] mt-0.5">₹{item.price || item.Price}</p>
                  </div>
                </div>
                <button onClick={() => removeItem(index)} className="text-gray-300 dark:text-white/20 hover:text-red-500 p-1 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-white/5">
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-black/40 p-1 rounded-xl border border-gray-200 dark:border-white/5">
                  <button onClick={() => updateQty(index, -1)} className="p-2 hover:bg-gray-200 dark:hover:bg-white/5 rounded-lg text-gray-400 dark:text-white/40"><Minus size={14} /></button>
                  <span className="w-8 text-center font-black text-xs italic">{item.quantity || 1}</span>
                  <button onClick={() => updateQty(index, 1)} className="p-2 hover:bg-gray-200 dark:hover:bg-white/5 rounded-lg text-orange-500"><Plus size={14} /></button>
                </div>
                <p className="font-black text-sm italic text-gray-800 dark:text-white/90 tracking-tighter">
                  ₹{(Number(item.price || item.Price || 0)) * (item.quantity || 1)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <ReceiptText size={14} className="text-gray-300 dark:text-black/20" />
            <h3 className="text-[10px] font-black uppercase text-gray-400 dark:text-black/30 tracking-[0.2em]">Bill Details</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-tight">
              <span>Item Total</span>
              <span>₹{total}</span>
            </div>
            <div className="flex justify-between text-[11px] font-black uppercase text-green-600 tracking-tight">
              <span>Platform Fee</span>
              <span>FREE</span>
            </div>

            <div className="pt-5 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
              <span className="text-xs font-black uppercase italic text-gray-400">Total Amount</span>
              <span className="text-4xl font-black italic text-orange-600 dark:text-white tracking-tighter">₹{total}</span>
            </div>
          </div>

          <button onClick={handleFinalPayment} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 shadow-2xl shadow-orange-600/40 flex items-center justify-center gap-3">
            Place Order
            <ChevronLeft className="rotate-180 opacity-40" size={16} />
          </button>
        </div>
      )}

      {showPaymentOptions && (
  <div className="fixed inset-0 bg-black/60 dark:bg-black/98 backdrop-blur-xl z-50 flex items-center justify-center p-6">
    <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
      
      {/* 1. Modal Header */}
      <h2 className="text-xl font-black text-center mb-8 text-black dark:text-white uppercase italic tracking-tighter">Payment Proof</h2>

      {/* 2. Agar transaction abhi chal rahi hai toh Loader dikhao */}
      {/* (Yahan ensure karein ki handleFinalPayment ke shuru mein aapne isUploading true kiya hai) */}
      {isUploading && !generatedUpiLink && !generatedUpiLinks.default ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <Loader2 className="animate-spin text-orange-600" size={40} />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Generating Secure Order...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          {/* --- DYNAMIC SECTION BASED ON DEVICE --- */}
          <div className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-3xl border border-orange-100 dark:border-orange-900/30 flex flex-col items-center">
            
            {deviceType === 'ios' ? (
              <div className="w-full space-y-3 mb-5">
                <p className="text-center text-[8px] font-black text-orange-600 uppercase mb-2 tracking-widest">Select Payment App</p>
                <div className="grid grid-cols-2 gap-2">
                  {/* PhonePe, GPay buttons... (Inka href check karein ki properly populated hai) */}
                  <a href={generatedUpiLinks.phonepe} className="bg-purple-600 text-white p-3 rounded-xl text-[10px] font-black uppercase text-center active:scale-95 transition-transform">PhonePe</a>
                  <a href={generatedUpiLinks.gpay} className="bg-blue-600 text-white p-3 rounded-xl text-[10px] font-black uppercase text-center active:scale-95 transition-transform">GPay</a>
                  <a href={generatedUpiLinks.paytm} className="bg-sky-500 text-white p-3 rounded-xl text-[10px] font-black uppercase text-center active:scale-95 transition-transform">Paytm</a>
                  <a href={generatedUpiLinks.default} className="bg-gray-800 text-white p-3 rounded-xl text-[10px] font-black uppercase text-center active:scale-95 transition-transform">Others</a>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => window.location.href = generatedUpiLink} 
                className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-3 mb-5 shadow-xl shadow-orange-600/20 active:scale-95"
              >
                <Smartphone size={18} /> Open UPI App
              </button>
            )}

            {/* QR Code backup */}
            <div className="bg-white p-3 rounded-2xl shadow-sm">
              <QRCodeSVG value={deviceType === 'ios' ? (generatedUpiLinks.default || "") : (generatedUpiLink || "")} size={140} />
            </div>
          </div>

          {/* --- COMMON UPLOAD SECTION --- */}
          <div className="space-y-3">
            <p className="text-[9px] font-black text-gray-400 uppercase text-center tracking-[0.2em]">Upload Payment Screenshot</p>
            <label className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] cursor-pointer overflow-hidden bg-gray-50 dark:bg-black/20">
              {screenshotBase64 ? (
                <img src={screenshotBase64} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="text-gray-300 dark:text-white/10" size={32} />
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <button 
            onClick={handleSubmitScreenshot} 
            disabled={!screenshotBase64 || isUploading} 
            className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 disabled:opacity-20 active:scale-95 transition-all"
          >
            {isUploading ? <Loader2 className="animate-spin" size={16} /> : "Confirm Order"}
          </button>
        </div>
      )}
    </div>
  </div>
)}
    </div>
  );
}

