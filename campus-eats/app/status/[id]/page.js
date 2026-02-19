'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { CheckCircle2, Clock, Utensils, ShoppingBag, ChevronLeft } from 'lucide-react';

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

  // --- IMPROVED PROGRESS LOGIC ---
  // Status sequence: AWAITING_PAYMENT -> AWAITING_VERIFICATION -> CONFIRMED/ACCEPTED -> READY -> COLLECTED
  const getStatusConfig = (status) => {
    switch (status) {
      case "AWAITING_PAYMENT": 
        return { index: 0, label: "Pay Now", sub: "Payment Pending" };
      case "AWAITING_VERIFICATION": 
        return { index: 1, label: "Verifying", sub: "Checking Screenshot" };
      case "CONFIRMED":
      case "ACCEPTED":
        return { index: 2, label: "Preparing", sub: "Chef is cooking" };
      case "READY":
        return { index: 3, label: "Ready", sub: "Collect your food" };
      case "COLLECTED":
        return { index: 4, label: "Done", sub: "Enjoy your meal!" };
      default:
        return { index: 0, label: "Pending", sub: "..." };
    }
  };

  const steps = ["Payment", "Verify", "Kitchen", "Ready"];
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

  // Success Screen
  if (order.status === 'COLLECTED') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-8 w-24 h-24 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-2xl shadow-green-500/20">✅</div>
        <h1 className="text-4xl font-black text-white mb-3 italic tracking-tighter">ORDER PICKED!</h1>
        <p className="text-gray-500 mb-12 text-sm font-bold uppercase tracking-widest">Hope you love the food.</p>
        <button onClick={() => router.push('/eatery')} className="w-full max-w-xs bg-white text-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl">New Order</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center p-6 pt-10">
      
      {/* Header Info */}
      <div className="w-full max-w-sm flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
           <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Live Tracking</span>
        </div>
        <span className="text-[10px] font-mono text-white/20 bg-white/5 px-3 py-1 rounded-full">
           {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* --- PREMIUM PROGRESS BAR --- */}
      <div className="w-full max-w-sm mb-16 relative px-2">
        <div className="flex justify-between mb-4">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={`text-[9px] font-black uppercase tracking-tighter transition-colors duration-500 ${i <= currentStatus.index ? 'text-orange-500' : 'text-white/10'}`}>
                {s}
              </div>
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i <= currentStatus.index ? 'bg-orange-500 scale-125 shadow-[0_0_10px_#f97316]' : 'bg-white/10'}`} />
            </div>
          ))}
        </div>
        <div className="absolute top-[23px] left-8 right-8 h-[2px] bg-white/5 -z-10" />
        <div 
          className="absolute top-[23px] left-8 h-[2px] bg-orange-500 -z-10 transition-all duration-1000 ease-in-out" 
          style={{ width: `${Math.min((currentStatus.index / (steps.length - 1)) * 80, 80)}%` }}
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

      {/* --- RECEIPT CARD --- */}
      <div className={`
        relative overflow-hidden transition-all duration-700 p-12 rounded-[3.5rem] border-2 w-full max-w-sm flex flex-col items-center justify-center
        ${currentStatus.index >= 2 ? 'border-orange-500/30 bg-gradient-to-b from-orange-500/10 to-transparent' : 'border-white/5 bg-white/[0.02]'}
        ${order.status === 'READY' ? 'shadow-[0_0_60px_rgba(249,115,22,0.15)] scale-[1.03] border-orange-500' : ''}
      `}>
        
        {/* Decorative corner icon */}
        <div className="absolute top-8 left-8 text-white/5">
          <ShoppingBag size={40} strokeWidth={3} />
        </div>

        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
          Token Number
        </p>
        
        <div className="relative">
          <p className={`font-black text-[120px] leading-none transition-all duration-700 italic tracking-tighter
            ${currentStatus.index >= 2 ? 'text-white translate-y-2' : 'text-orange-600 opacity-50'}
          `}>
            {order.orderId}
          </p>
          {order.status === 'READY' && (
             <div className="absolute -top-4 -right-4 bg-green-500 text-black text-[10px] font-black px-3 py-1 rounded-full animate-bounce">
               PICKUP
             </div>
          )}
        </div>

        {/* Dynamic Message */}
        <div className="mt-8 flex items-center gap-2 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
           {currentStatus.index < 2 ? <Clock size={14} className="text-orange-500" /> : <Utensils size={14} className="text-orange-500" />}
           <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
             {order.status === "READY" ? "Counter 01" : "Est. 10-15 Mins"}
           </span>
        </div>
      </div>

      <button 
        onClick={() => router.push('/eatery')} 
        className="mt-12 flex items-center gap-2 text-white/20 text-[10px] font-black uppercase tracking-widest hover:text-orange-500 transition-colors"
      >
        <ChevronLeft size={14} /> Back to eatery
      </button>
    </div>
  );
}