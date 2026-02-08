'use client';
import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function OrderStatus() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 1. Core Security States
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
  if (!id) return;

  const docRef = doc(db, "orders", id);
  
  const unsub = onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      console.log("Current Status:", data.status); // Check your browser console
      setOrder({ ...data, id: snap.id });
    } else {
      console.error("No such order in DB!");
    }
    setLoading(false);
  }, (error) => {
    console.error("Firestore Permission/Connection Error:", error);
    setLoading(false);
  });

  return () => unsub();
}, [id]);

  // 3. Memoized Security Code: Updates only when hour or order ID changes
  const securityCode = useMemo(() => {
    if (!order || !order.id) return "0000";
    const hour = currentTime.getHours();
    const idPart = order.id.slice(-2).toUpperCase();
    return `${idPart}${hour < 10 ? '0' + hour : hour}`;
  }, [order, currentTime.getHours()]); // Dependency on the hour specifically

  const isGlowing = currentTime.getSeconds() % 2 === 0;
  const isAccepted = order && ['CONFIRMED', 'ACCEPTED'].includes(order.status);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-white font-bold text-xl">Order Not Found</h1>
        <button onClick={() => router.push('/eatery')} className="mt-6 bg-white text-black px-6 py-2 rounded-xl font-bold">Go Home</button>
      </div>
    );
  }

  // --- COLLECTED VIEW ---
  if (order.status === 'COLLECTED') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
          <span className="text-4xl text-green-500">✅</span>
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Order Collected!</h1>
        <p className="text-gray-400 mb-10 text-sm font-medium">Thank you for ordering from Campus Bites.</p>
        <div className="bg-[#0f1115] border border-gray-800 p-8 rounded-[2.5rem] w-full max-w-sm mb-10 shadow-2xl">
          <p className="text-7xl font-black text-orange-500 mb-4">#{order.orderId}</p>
          <p className="text-white/80 font-bold">Total Paid: ₹{order.total}</p>
        </div>
        <button onClick={() => router.push('/eatery')} className="w-full max-w-sm bg-white text-black py-4 rounded-2xl font-black active:scale-95 transition-all">Order Something Else</button>
      </div>
    );
  }

  // --- REJECTED VIEW ---
  if (order.status === 'REJECTED') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center text-4xl">❌</div>
        <h1 className="text-3xl font-black text-white mb-2">Order Rejected</h1>
        <p className="text-gray-400 mb-8">Please visit the counter for a refund.</p>
        <button onClick={() => router.push('/eatery')} className="w-full max-w-sm bg-white text-black py-4 rounded-2xl font-black">Back to Home</button>
      </div>
    );
  }

  // --- ACTIVE VIEW ---
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
      
      <h1 className="text-3xl font-black text-white mb-2 transition-all">
        {isAccepted ? "Order Confirmed" : "Verifying Payment"}
      </h1>
      <p className="text-gray-400 mb-10 max-w-[280px] text-sm font-medium">
        {isAccepted 
          ? "Show this security receipt at the counter to collect your food." 
          : "Waiting for merchant to confirm your payment of ₹" + (order.total || 0)}
      </p>

      {/* --- SMART SECURITY RECEIPT CARD --- */}
      <div className={`
        relative overflow-hidden transition-all duration-500 p-8 rounded-[3rem] border-4 w-full max-w-sm
        ${isAccepted && isGlowing ? 'border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.4)] scale-[1.02]' : 'border-gray-800'}
        ${isAccepted ? 'bg-gradient-to-b from-gray-900 to-black' : 'bg-[#0f1115]'}
      `}>
        
        {/* Live Clock Tag (Screenshot Killer) */}
        <div className="absolute top-4 right-6 flex items-center gap-2">
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

        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
          {isAccepted ? "Verification Receipt" : "Order Number"}
        </p>
        
        <p className={`font-black transition-all duration-500 ${isAccepted ? 'text-8xl text-white' : 'text-7xl text-orange-500'}`}>
          #{order.orderId}
        </p>

        {isAccepted && (
          <div className="mt-8 animate-in fade-in zoom-in duration-700">
            <div className="bg-white text-black px-6 py-4 rounded-2xl inline-block shadow-2xl transform transition-transform">
              <p className="text-[8px] font-black uppercase text-gray-400 leading-none mb-1">Security Code</p>
              <p className="text-4xl font-black tracking-[0.2em]">{securityCode}</p>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
               <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
               <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Live Security Active</p>
            </div>
          </div>
        )}

        {!isAccepted && (
          <p className="text-gray-600 text-[10px] font-mono mt-4 tracking-widest uppercase">
            ID: {order.id?.slice(-8) || "..."}
          </p>
        )}
      </div>

      <button 
        onClick={() => router.push('/eatery')} 
        className="mt-12 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors py-4 px-8"
      >
        ← Return to Menu
      </button>
    </div>
  );
}