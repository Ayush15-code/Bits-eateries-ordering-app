'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '../lib/firebase'; 
import { 
  collection, 
  doc, 
  runTransaction, 
  serverTimestamp,
  updateDoc 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronLeft, Trash2, Camera, Loader2, Smartphone, Plus, Minus, ReceiptText } from 'lucide-react';

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [shopId, setShopId] = useState('');
  const [user, setUser] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [generatedUpiLink, setGeneratedUpiLink] = useState('');
  const [lastCreatedOrderId, setLastCreatedOrderId] = useState('');

  const [screenshotBase64, setScreenshotBase64] = useState(""); 
  const [isUploading, setIsUploading] = useState(false);

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
      console.error("Failed to load cart:", err);
      setIsHydrated(true); 
    }
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!isHydrated) return; 
    const newTotal = cart.reduce((sum, item) => sum + (Number(item.price || item.Price || 0) * (item.quantity || 1)), 0);
    setTotal(newTotal);
    localStorage.setItem('pending_cart', JSON.stringify(cart));
  }, [cart, isHydrated]);

  // --- Image Compression ---
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

  const handleUpiClick = () => {
    if (!generatedUpiLink) return;
    window.location.href = generatedUpiLink;
  };

  // --- Cart Quantity Actions ---
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
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
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
          if (data.lastDate === todayStr) { nextId = data.currentCount + 1; }
        }
        transaction.set(counterRef, { currentCount: nextId, lastDate: todayStr }, { merge: true });

        const newOrderRef = doc(ordersCol);
        transaction.set(newOrderRef, {
          orderId: nextId,
          userId: user?.uid || "unknown",
          userName: user?.displayName || "Student",
          items: cart,
          total: total,
          status: "AWAITING_PAYMENT", 
          createdAt: serverTimestamp(),
          dateStr: todayStr,
          shopId: shopId
        });
        return { docId: newOrderRef.id, numericId: nextId };
      });

      setLastCreatedOrderId(newOrderData.docId);
      const upi = `upi://pay?pa=tushar.nandal678@okhdfcbank&pn=CampusEats&am=${total}&cu=INR&tn=Order-${newOrderData.numericId}`;
      setGeneratedUpiLink(upi);
      setShowPaymentOptions(true);
    } catch (e) {
      console.error(e);
      alert("Order failed.");
    }
  };

  const handleSubmitScreenshot = async () => {
    if (!screenshotBase64 || !lastCreatedOrderId) return;
    setIsUploading(true);
    try {
      const orderRef = doc(db, "orders", lastCreatedOrderId);
      await updateDoc(orderRef, {
        screenshotBase64: screenshotBase64, 
        status: "AWAITING_VERIFICATION",
        submittedAt: serverTimestamp()
      });
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
    <div className="max-w-md mx-auto p-6 bg-[#050505] min-h-screen text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-black uppercase italic tracking-tighter">Review Order</h1>
        <div className="w-11"></div>
      </div>

      {/* Cart Items */}
      <div className="space-y-4 mb-8">
        {cart.length === 0 ? (
          <div className="text-center py-20 opacity-20 font-black uppercase text-xs tracking-widest">Cart is empty</div>
        ) : (
          cart.map((item, index) => (
            <div key={index} className="bg-white/5 p-5 rounded-[2rem] border border-white/10 flex flex-col gap-4 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="bg-orange-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm italic shadow-lg shadow-orange-600/20">
                    {item.quantity || 1}x
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase italic tracking-tight">{item.name || item.itemName}</p>
                    <p className="text-orange-500 font-black text-[10px] mt-0.5">₹{item.price}</p>
                  </div>
                </div>
                <button onClick={() => removeItem(index)} className="text-white/20 hover:text-red-500 p-1 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Qty Controls */}
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                  <button onClick={() => updateQty(index, -1)} className="p-2 hover:bg-white/5 rounded-lg text-white/40"><Minus size={14} /></button>
                  <span className="w-8 text-center font-black text-xs italic">{item.quantity || 1}</span>
                  <button onClick={() => updateQty(index, 1)} className="p-2 hover:bg-white/5 rounded-lg text-orange-500"><Plus size={14} /></button>
                </div>
                <p className="font-black text-sm italic text-white/90 tracking-tighter">
                  ₹{(item.price || 0) * (item.quantity || 1)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bill Summary Section */}
      {cart.length > 0 && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <ReceiptText size={14} className="text-black/20" />
            <h3 className="text-[10px] font-black uppercase text-black/30 tracking-[0.2em]">Bill Details</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-[11px] font-black uppercase text-black/40 tracking-tight">
              <span>Item Total</span>
              <span>₹{total}</span>
            </div>
            <div className="flex justify-between text-[11px] font-black uppercase text-green-600 tracking-tight">
              <span>Platform Fee</span>
              <span>FREE</span>
            </div>
            
            <div className="pt-5 border-t border-black/5 flex justify-between items-center">
              <span className="text-xs font-black uppercase italic text-black/20">Total Amount</span>
              <span className="text-4xl font-black italic text-black tracking-tighter">₹{total}</span>
            </div>
          </div>

          <button onClick={handleFinalPayment} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 shadow-2xl shadow-orange-600/40 flex items-center justify-center gap-3">
            Place Order
            <ChevronLeft className="rotate-180 opacity-40" size={16} />
          </button>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentOptions && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black text-center mb-8 text-black uppercase italic tracking-tighter">Payment Proof</h2>
            
            <div className="space-y-6">
              <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100 flex flex-col items-center">
                <button onClick={handleUpiClick} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-3 mb-5 shadow-xl shadow-orange-600/20 active:scale-95">
                  <Smartphone size={18} /> Open UPI App
                </button>
                <div className="bg-white p-3 rounded-2xl shadow-sm">
                  <QRCodeSVG value={generatedUpiLink} size={140} />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[9px] font-black text-black/30 uppercase text-center tracking-[0.2em]">Upload Payment Screenshot</p>
                <label className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-black/5 rounded-[2rem] cursor-pointer overflow-hidden bg-black/5">
                  {screenshotBase64 ? (
                    <img src={screenshotBase64} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="text-black/10" size={32} />
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              <button onClick={handleSubmitScreenshot} disabled={!screenshotBase64 || isUploading} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 disabled:opacity-20 active:scale-95 transition-all">
                {isUploading ? <Loader2 className="animate-spin" size={16} /> : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}