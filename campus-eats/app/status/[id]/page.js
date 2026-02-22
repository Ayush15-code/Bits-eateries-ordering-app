'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { CheckCircle2, Clock, Utensils, ShoppingBag, ChevronLeft, ShieldCheck } from 'lucide-react';

export default function OrderStatus() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!id) return;
    const docRef = doc(db, "orders", id);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setOrder({ ...snap.data(), id: snap.id });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- UPDATED STATUS LOGIC TO MATCH CHECKOUT.JS ---
  const getStatusConfig = (status) => {
    switch (status) {
      case "PENDING_SCREENSHOT": 
        return { index: 0, label: "Payment", sub: "Waiting for Screenshot" };
      case "AWAITING_VERIFICATION": 
        return { index: 1, label: "Verifying", sub: "Merchant checking payment" };
      case "CONFIRMED":
      case "ACCEPTED":
      case "PREPARING":
        return { index: 2, label: "Cooking", sub: "Chef is on it" };
      case "READY":
        return { index: 3, label: "Ready", sub: "Pick up from counter" };
      case "COLLECTED":
        return { index: 4, label: "Done", sub: "Order Completed" };
      default:
        return { index: 0, label: "Pending", sub: "Processing..." };
    }
  };

  const steps = ["Pay", "Verify", "Kitchen", "Ready"];
  const currentStatus = getStatusConfig(order?.status);
  
  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-white font-black text-xl italic uppercase">Order Not Found</h1>
      <button onClick={() => router.push('/eatery')} className="mt-6 bg-orange-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs">Back to Menu</button>
    </div>
  );

  if (order.status === 'COLLECTED') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-8 w-24 h-24 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-2xl shadow-green-500/20">✅</div>
        <h1 className="text-4xl font-black text-white mb-2 italic tracking-tighter uppercase">Enjoy!</h1>
        <p className="text-gray-500 mb-8 text-[10px] font-bold uppercase tracking-[0.3em]">Order Picked Successfully</p>

        {/* --- ADDED ORDER SUMMARY CARD --- */}
        <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-[2.5rem] p-6 mb-10 space-y-4">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-500 mb-2">You Had:</p>
          <div className="space-y-3">
            {order.items && order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                <div className="text-left">
                  <p className="text-sm font-black text-white italic leading-none">
                    {item.name} {item.category && item.category !== "General" ? item.category : ""}
                  </p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-black text-white italic">₹{Number(item.price) * item.quantity}</p>
              </div>
            ))}
          </div>
          <div className="pt-2 flex justify-between items-center border-t border-white/10">
            <span className="text-[9px] font-black uppercase text-gray-500">Total Bill</span>
            <span className="text-xl font-black text-orange-600 italic">₹{order.total}</span>
          </div>
        </div>

        <button 
          onClick={() => router.push('/eatery')} 
          className="w-full max-w-xs bg-white text-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all"
        >
          New Order
        </button>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center p-6 pt-10">
      
      {/* Header Info */}
      <div className="w-full max-w-sm flex justify-between items-center mb-10">
        <button onClick={() => router.push('/eatery')} className="p-2 bg-white/5 rounded-full text-white/40">
           <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
           <div className={`w-2 h-2 rounded-full animate-pulse ${order.status === 'READY' ? 'bg-green-500' : 'bg-orange-500'}`} />
           <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Live Tracking</span>
        </div>
        <span className="text-[10px] font-mono text-white/20 bg-white/5 px-3 py-1 rounded-full">
           {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* --- PROGRESS BAR --- */}
      <div className="w-full max-w-sm mb-16 relative px-2">
        <div className="flex justify-between mb-4">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2 relative z-10">
              <div className={`text-[9px] font-black uppercase tracking-tighter transition-colors duration-500 ${i <= currentStatus.index ? 'text-orange-500' : 'text-white/10'}`}>
                {s}
              </div>
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${i <= currentStatus.index ? 'bg-orange-500 scale-125 shadow-[0_0_10px_#f97316]' : 'bg-white/10'}`} />
            </div>
          ))}
        </div>
        {/* Track Line */}
        <div className="absolute top-[24px] left-8 right-8 h-[1px] bg-white/5 -z-0" />
        <div 
          className="absolute top-[24px] left-8 h-[1px] bg-orange-500 -z-0 transition-all duration-1000 ease-in-out" 
          style={{ width: `${Math.min((currentStatus.index / (steps.length - 1)) * 100, 85)}%` }}
        />
      </div>

      {/* Main Status Text */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2 uppercase">
          {currentStatus.label}
        </h2>
        <p className="text-orange-500/60 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
          {currentStatus.sub}
        </p>
      </div>

      {/* --- TOKEN CARD --- */}
      <div className={`
        relative overflow-hidden transition-all duration-700 p-12 rounded-[3.5rem] border-2 w-full max-w-sm flex flex-col items-center justify-center
        ${currentStatus.index >= 2 ? 'border-orange-500/30 bg-gradient-to-b from-orange-500/10 to-transparent shadow-[0_0_60px_rgba(249,115,22,0.1)]' : 'border-white/5 bg-white/[0.02]'}
        ${order.status === 'READY' ? 'border-green-500 shadow-[0_0_60px_rgba(34,197,94,0.1)] scale-[1.05]' : ''}
      `}>
        
        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
          Token Number
        </p>
        
        <div className="relative">
          <p className={`font-black text-[120px] leading-none italic tracking-tighter transition-all duration-500
            ${order.status === 'READY' ? 'text-green-500' : 'text-white'}
          `}>
            {order.orderId}
          </p>
          {order.status === 'READY' && (
             <div className="absolute -top-4 -right-4 bg-green-500 text-black text-[9px] font-black px-4 py-1.5 rounded-full animate-bounce shadow-xl">
               READY TO PICK
             </div>
          )}
        </div>

        {/* Info Badge */}
        <div className="mt-8 flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
           {order.status === "AWAITING_VERIFICATION" ? (
             <ShieldCheck size={14} className="text-blue-500" />
           ) : (
             <Utensils size={14} className="text-orange-500" />
           )}
           <span className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">
             {order.status === "READY" ? "Go to Counter" : "Preparing Food"}
           </span>
        </div>
      </div>

      {/* Order Summary */}
      <div className="w-full max-w-sm mt-10 p-5 bg-white/5 rounded-3xl border border-white/5">
         <div className="flex justify-between items-center opacity-40 mb-4">
            <span className="text-[10px] font-black uppercase">Your Order</span>
            <span className="text-[10px] font-black">₹{order.total}</span>
         </div>
         <div className="space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-xs font-bold uppercase italic">
                <span className="text-white/60">{item.quantity}x {item.name || item.itemName}</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}