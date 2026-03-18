'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '../lib/firebase';
import {
  collection, doc, runTransaction, serverTimestamp, updateDoc, getDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { QRCodeCanvas } from 'qrcode.react';
import { ChevronLeft, Trash2, Camera, Loader2, Share2, Plus, Minus, X } from 'lucide-react';

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [shopId, setShopId] = useState('');
  const [shop, setShop] = useState(null);
  const [user, setUser] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [upiLink, setUpiLink] = useState('');
  const [lastCreatedOrderId, setLastCreatedOrderId] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [lastNumericId, setLastNumericId] = useState(null);
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

  // NEW: Clear Entire Cart Function
  const clearCart = () => {
    if (window.confirm("Clear all items from your tray?")) {
      setCart([]);
      localStorage.removeItem('pending_cart');
      localStorage.removeItem('pending_shop_id');
      router.push('/eatery'); // Redirect back to shop list/menu
    }
  };
  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;

    // Create a temporary link element
    const link = document.createElement('a');
    link.download = `CampusEats_QR_${lastNumericId || 'Order'}.png`;
    link.href = canvas.toDataURL('image/png');

    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleShareAndPay = async () => {
    try {
      const canvas = document.getElementById('qr-canvas');
      if (!canvas) return;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'payment_qr.png', { type: 'image/png' });
      const shareData = {
        title: 'Pay for Order',
        text: `Pay ₹${total} to ${shop?.name}. (Order #${lastNumericId})`,
        files: [file],
      };
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        alert("Sharing not supported. Please take a screenshot.");
      }
    } catch (err) { console.error("Share failed:", err); }
  };

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

    const upiId = shop?.upiId?.trim() || "ayush12123a@okhdfcbank";
    const name = shop?.name || "CampusEats";
    const amt = Number(total).toFixed(2);

    const link = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amt}&cu=INR`;
    setUpiLink(link);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const counterRef = doc(db, "internal", "order_counter");
      const ordersCol = collection(db, "orders");

      const newOrderData = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        let nextId = 1;
        if (counterSnap.exists()) {
          const data = counterSnap.data();
          if (data.lastDate === todayStr) nextId = data.currentCount + 1;
        }
        transaction.set(counterRef, { currentCount: nextId, lastDate: todayStr }, { merge: true });
        const newOrderRef = doc(ordersCol);
        transaction.set(newOrderRef, {
          orderId: nextId,
          userId: user?.uid || "unknown",
          userName: auth.currentUser?.displayName || "Student",
          items: cart,
          total: total,
          status: "PENDING_SCREENSHOT",
          createdAt: serverTimestamp(),
          shopId: shopId || "default_shop"
        });
        return { docId: newOrderRef.id, numericId: nextId };
      });

      setLastCreatedOrderId(newOrderData.docId);
      setLastNumericId(newOrderData.numericId);

    } catch (e) {
      console.error(e);
      alert("Order failed.");
      setShowPaymentOptions(false);
    }
  };

  const handleSubmitScreenshot = async () => {
    if (!screenshotBase64 || !lastCreatedOrderId) return;
    setIsUploading(true);
    try {
      await updateDoc(doc(db, "orders", lastCreatedOrderId), {
        screenshotBase64,
        status: "AWAITING_VERIFICATION",
        submittedAt: serverTimestamp()
      });

      const newOrder = {
        id: lastCreatedOrderId,
        orderId: lastNumericId,
        items: cart,
        total: total,
        status: "AWAITING_VERIFICATION",
        timestamp: Date.now(),
        shopId: shopId
      };

      const prevHistory = JSON.parse(localStorage.getItem('order_history_v2') || '[]');
      localStorage.setItem('order_history_v2', JSON.stringify([newOrder, ...prevHistory]));
      localStorage.setItem('active_order_id', lastCreatedOrderId);

      localStorage.removeItem('pending_cart');
      localStorage.removeItem('pending_shop_id');

      setCart([]);
      setShopId('');
      setTotal(0);
      setShowPaymentOptions(false);
      router.push(`/status/${lastCreatedOrderId}`);
    } catch (e) {
      alert("Upload failed.");
    } finally { setIsUploading(false); }
  };

  if (!isHydrated) return null;

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-[#050505] min-h-screen text-gray-900 dark:text-white transition-colors">

      {/* Header with Back Button and NEW CLEAR CROSS */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => router.back()} className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 active:scale-90 transition-all shadow-sm text-orange-600">
          <ChevronLeft size={20} />
        </button>

        <h1 className="text-xl font-black uppercase italic tracking-tighter">Review Order</h1>

        {/* CLEAR CROSS BUTTON */}
        <button
          onClick={clearCart}
          className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 active:scale-90 transition-all shadow-sm text-red-500"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {cart.map((item, index) => {
          const itemName = (item.name || item.itemName || "").split('(')[0].trim();
          const categoryName = (item.category || "").trim();
          let cleanDisplayName = itemName;
          if (categoryName && itemName.toUpperCase() !== categoryName.toUpperCase()) {
            cleanDisplayName = `${itemName} ${categoryName}`;
          }

          return (
            <div key={index} className="bg-white dark:bg-white/5 p-5 rounded-[2rem] border border-gray-100 dark:border-white/10 flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="bg-orange-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm italic text-white">
                    {item.quantity || 1}x
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase italic tracking-tight">
                      {cleanDisplayName}
                    </p>
                    <p className="text-orange-500 font-black text-[10px] mt-0.5">₹{item.price || item.Price}</p>
                  </div>
                </div>
                <button onClick={() => removeItem(index)} className="text-gray-300 dark:text-white/20 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-white/5">
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-black/40 p-1 rounded-xl border border-gray-200 dark:border-white/5">
                  <button onClick={() => updateQty(index, -1)} className="p-2"><Minus size={14} /></button>
                  <span className="w-8 text-center font-black text-xs italic">{item.quantity || 1}</span>
                  <button onClick={() => updateQty(index, 1)} className="p-2 text-orange-500"><Plus size={14} /></button>
                </div>
                <p className="font-black text-sm italic">
                  ₹{(Number(item.price || item.Price || 0)) * (item.quantity || 1)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase italic text-gray-400">Total Amount</span>
            <span className="text-4xl font-black italic text-orange-600 dark:text-white tracking-tighter">₹{total}</span>
          </div>
          <button onClick={handleFinalPayment} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 shadow-2xl shadow-orange-600/40">
            Confirm Order
          </button>
        </div>
      )}

      {/* Payment Modals remain same... */}
      {showPaymentOptions && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/98 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black mb-6 uppercase italic tracking-tighter">Pay & Upload</h2>
            <div className="space-y-6">
              <div className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-3xl border border-orange-100 dark:border-orange-900/30 flex flex-col items-center">
                <div className="bg-white p-3 rounded-2xl shadow-sm mb-6">
                  <QRCodeCanvas id="qr-canvas" value={upiLink || "upi://pay"} size={180} level="H" includeMargin={true} />
                </div>
                <button onClick={handleShareAndPay} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-orange-600/20">
                  <Share2 size={16} /> Share QR & Pay
                </button>
                <button
                  onClick={handleDownloadQR}
                  className="w-full bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-500 py-3 rounded-2xl font-black uppercase text-[9px] border border-orange-100 dark:border-orange-900/50 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="9" x2="12" y2="15" /></svg>
                  Save to Gallery
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-[9px] font-black text-gray-400 uppercase text-center tracking-[0.2em]">Upload Screenshot</p>
                <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] cursor-pointer overflow-hidden bg-gray-50 dark:bg-black/20">
                  {screenshotBase64 ? <img src={screenshotBase64} alt="Preview" className="w-full h-full object-cover" /> : <Camera className="text-gray-300" size={24} />}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
              <button onClick={handleSubmitScreenshot} disabled={!screenshotBase64 || isUploading} className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 disabled:opacity-20 active:scale-95 transition-all">
                {isUploading ? <Loader2 className="animate-spin" size={16} /> : "Verify Payment"}
              </button>
            </div>
            <button onClick={() => setShowPaymentOptions(false)} className="w-full mt-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}