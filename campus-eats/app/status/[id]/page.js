'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

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

  const isGlowing = currentTime.getSeconds() % 2 === 0;
  const isAccepted = order && ['CONFIRMED', 'ACCEPTED', 'READY'].includes(order.status);

  // --- PROGRESS BAR LOGIC ---
  const steps = ["AWAITING_VERIFICATION", "CONFIRMED", "READY"];
  const currentStepIndex = order ? steps.indexOf(order.status) : 0;

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-white font-bold text-xl">Order Not Found</h1>
      <button onClick={() => router.push('/eatery')} className="mt-6 bg-white text-black px-6 py-2 rounded-xl font-bold">Go Home</button>
    </div>
  );

  if (order.status === 'COLLECTED') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-4xl">✅</div>
        <h1 className="text-3xl font-black text-white mb-2">Order Collected!</h1>
        <p className="text-gray-400 mb-10 text-sm font-medium">Thank you for ordering.</p>
        <button onClick={() => router.push('/eatery')} className="w-full max-w-sm bg-white text-black py-4 rounded-2xl font-black">Order Something Else</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center p-6 text-center pt-12">
      
      {/* --- PROGRESS BAR SECTION --- */}
      <div className="w-full max-w-sm mb-12 px-4">
        <div className="flex justify-between mb-2">
          {steps.map((s, i) => (
            <span key={i} className={`text-[8px] font-black uppercase tracking-widest ${i <= currentStepIndex ? 'text-orange-500' : 'text-gray-600'}`}>
              {s.replace('AWAITING_', '').replace('CONFIRMED', 'PREPARING')}
            </span>
          ))}
        </div>
        <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-orange-500 transition-all duration-1000 ease-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <h1 className="text-3xl font-black text-white mb-2 transition-all">
        {order.status === "READY" ? "Pick Up Ready!" : isAccepted ? "Order Confirmed" : "Verifying Payment"}
      </h1>
      
      <p className="text-gray-400 mb-10 max-w-[280px] text-sm font-medium">
        {order.status === "READY" 
          ? "Head to the counter now!" 
          : isAccepted 
            ? "Your order is being prepared. Grab it once it's ready!" 
            : "Waiting for merchant to confirm your payment of ₹" + (order.total || 0)}
      </p>

      {/* --- CLEAN RECEIPT CARD (WITHOUT SECURITY CODE) --- */}
      <div className={`
        relative overflow-hidden transition-all duration-500 p-10 rounded-[3rem] border-4 w-full max-w-sm flex flex-col items-center justify-center
        ${isAccepted && isGlowing ? 'border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.4)] scale-[1.02]' : 'border-gray-800'}
        ${isAccepted ? 'bg-gradient-to-b from-gray-900 to-black' : 'bg-[#0f1115]'}
      `}>
        
        <div className="absolute top-6 right-8 flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isAccepted ? 'bg-green-500 animate-pulse' : 'bg-orange-500 animate-bounce'}`} />
          <span className="text-[10px] font-mono text-gray-500 tabular-nums">
            {currentTime.toLocaleTimeString()}
          </span>
        </div>

        {!isAccepted && (
          <div className="flex justify-center mb-6">
            <div className="w-10 h-10 border-t-2 border-orange-500 rounded-full animate-spin" />
          </div>
        )}

        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
          Order Number
        </p>
        
        <p className={`font-black transition-all duration-500 ${isAccepted ? 'text-9xl text-white' : 'text-8xl text-orange-500'}`}>
          #{order.orderId}
        </p>

        {isAccepted && (
          <p className="mt-6 text-[10px] font-black text-orange-500 uppercase tracking-widest animate-pulse">
            Cooking in progress
          </p>
        )}
      </div>

      <button onClick={() => router.push('/eatery')} className="mt-12 text-gray-500 text-xs font-bold uppercase tracking-widest py-4 px-8 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors">
        ← Return Home
      </button>
    </div>
  );
}