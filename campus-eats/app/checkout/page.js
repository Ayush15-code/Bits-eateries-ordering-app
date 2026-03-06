'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '../lib/firebase';
import {
  collection, doc, runTransaction, serverTimestamp, updateDoc, getDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronLeft, Trash2, Camera, Loader2, Smartphone, Plus, Minus, ReceiptText } from 'lucide-react';

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [shopId, setShopId] = useState('');
  const [shop, setShop] = useState(null);
  const [user, setUser] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [generatedUpiLinks, setGeneratedUpiLinks] = useState({
    phonepe: '', gpay: '', paytm: '', default: ''
  });
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

    setShowPaymentOptions(true);
    setIsUploading(true);

    const userAgent = window.navigator.userAgent || window.navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                  (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));

    const verificationCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const merchantUpi = shop?.upiId?.trim() || "ayush12123a@okhdfcbank"; 
    const merchantName = encodeURIComponent(shop?.name || "CampusEats");
    const transactionNote = encodeURIComponent(`Order ${verificationCode}`);
    const transactionRef = `TR${Date.now()}`;
    const formattedAmount = Number(total).toFixed(2);
    
    // Correctly structured UPI parameters
    const upiParams = `pa=${merchantUpi}&pn=${merchantName}&am=${formattedAmount}&cu=INR&tn=${transactionNote}&tr=${transactionRef}`;
    
    const links = {
      phonepe: isIOS ? `phonepe://pay?${upiParams}` : `intent://pay?${upiParams}#Intent;scheme=upi;package=com.phonepe.app;end`,
      gpay: isIOS ? `googlegpay://pay?${upiParams}` : `intent://pay?${upiParams}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`,
      paytm: isIOS ? `paytmmp://pay?${upiParams}` : `intent://pay?${upiParams}#Intent;scheme=upi;package=net.one97.paytm;end`,
      default: `upi://pay?${upiParams}`
    };

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
            nextId = data.currentCount + 1;
          }
        }

        transaction.set(counterRef, { currentCount: nextId, lastDate: todayStr }, { merge: true });

        const newOrderRef = doc(ordersCol);
        transaction.set(newOrderRef, {
          orderId: nextId,
          userId: user?.uid || "unknown",
          userName: auth.currentUser?.displayName || "Student",
          items: cart,
          total: total,
          verificationCode: verificationCode,
          status: "PENDING_SCREENSHOT",
          createdAt: serverTimestamp(),
          shopId: shopId || "default_shop"
        });

        return { docId: newOrderRef.id, numericId: nextId };
      });

      setDeviceType(isIOS ? 'ios' : 'android');
      setGeneratedUpiLinks(links);
      setLastCreatedOrderId(newOrderData.docId);
      setLastNumericId(newOrderData.numericId);
      setIsUploading(false);

    } catch (e) {
      console.error("TRANSACTION ERROR:", e);
      setIsUploading(false);
      alert("Order failed. Please check your internet.");
    }
  };

  const handleSubmitScreenshot = async () => {
    if (!screenshotBase64 || !lastCreatedOrderId) {
      alert("Please upload screenshot!");
      return;
    }

    setIsUploading(true);

    try {
      const orderRef = doc(db, "orders", lastCreatedOrderId);
      await updateDoc(orderRef, {
        screenshotBase64: screenshotBase64,
        status: "AWAITING_VERIFICATION",
        submittedAt: serverTimestamp()
      });

      const activeOrder = {
        id: lastCreatedOrderId,
        orderId: lastNumericId || "...",
        total: total,
        items: cart,
        status: "AWAITING_VERIFICATION",
        timestamp: Date.now()
      };

      const existingHistory = JSON.parse(localStorage.getItem('order_history_v2') || '[]');
      localStorage.setItem('order_history_v2', JSON.stringify([activeOrder, ...existingHistory]));
      localStorage.removeItem('pending_cart');
      router.push(`/status/${lastCreatedOrderId}`);
    } catch (error) {
      console.error("Upload Error:", error);
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
          <div className="flex items-center gap-2 mb-2 text-gray-400">
            <ReceiptText size={14} />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Bill Details</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-[11px] font-black uppercase text-gray-500 tracking-tight">
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
        <div className="fixed inset-0 bg-black/60 dark:bg-black/98 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black mb-6 text-black dark:text-white uppercase italic tracking-tighter">Pay & Upload</h2>

            {isUploading && !lastCreatedOrderId ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="animate-spin text-orange-600" size={40} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Securing Order...</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-3xl border border-orange-100 dark:border-orange-900/30 flex flex-col items-center">
                  <p className="text-center text-[8px] font-black text-orange-600 uppercase mb-4 tracking-widest">Select Payment App</p>
                  <div className="w-full grid grid-cols-2 gap-3 mb-6">
                    <a href={generatedUpiLinks.gpay} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 active:scale-90 transition-transform">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-[10px]">G</div>
                      <span className="text-[9px] font-black uppercase italic">GPay</span>
                    </a>
                    <a href={generatedUpiLinks.phonepe} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 active:scale-90 transition-transform">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600 text-[10px]">P</div>
                      <span className="text-[9px] font-black uppercase italic">PhonePe</span>
                    </a>
                    <a href={generatedUpiLinks.paytm} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 active:scale-90 transition-transform">
                      <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center font-bold text-sky-600 text-[10px]">P</div>
                      <span className="text-[9px] font-black uppercase italic">Paytm</span>
                    </a>
                    <a href={generatedUpiLinks.default} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 active:scale-90 transition-transform text-gray-400">
                      <Smartphone size={16} />
                      <span className="text-[9px] font-black uppercase italic">Others</span>
                    </a>
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <QRCodeSVG value={generatedUpiLinks.default || "upi://pay"} size={120} />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-black text-gray-400 uppercase text-center tracking-[0.2em]">Upload Screenshot</p>
                  <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] cursor-pointer overflow-hidden bg-gray-50 dark:bg-black/20">
                    {screenshotBase64 ? (
                      <img src={screenshotBase64} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="text-gray-300 dark:text-white/10" size={24} />
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
            <button onClick={() => setShowPaymentOptions(false)} className="w-full mt-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}