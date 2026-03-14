'use client';
import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { ChevronLeft, Trash2, History, ChevronRight, LogOut } from 'lucide-react';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      fetchHistory();
    }
  }, [isHydrated]);

  const fetchHistory = async () => {
    try {
      // Trying both common history keys to be safe
      const historyRaw = localStorage.getItem('order_history_v2') || localStorage.getItem('order_history');
      let historyArr = [];
      if (historyRaw) {
        try {
          historyArr = JSON.parse(historyRaw);
        } catch { historyArr = []; }
      }

      const now = Date.now();
      const filtered = historyArr.filter(o => now - (o.timestamp || 0) < 24 * 60 * 60 * 1000);
      
      if (filtered.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const orderDetails = await Promise.all(
        filtered.map(async (o) => {
          try {
            // IMPORTANT: Fetch using the unique Firestore Document ID
            // status/[id] expects the Firestore auto-generated string ID
            const targetId = o.id || o.docId;
            if (!targetId) return null;
            const docSnap = await getDoc(doc(db, "orders", targetId));
            return docSnap.exists() ? { ...docSnap.data(), docId: docSnap.id } : null;
          } catch (err) { return null; }
        })
      );

      const validOrders = orderDetails
        .filter(o => o !== null)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(validOrders);
    } catch (err) {
      console.error("History fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await signOut(auth);
      localStorage.removeItem('order_history_v2');
      localStorage.removeItem('order_history');
      router.push('/login');
    }
  };

  const clearHistory = () => {
    if (window.confirm("Clear all order history?")) {
      localStorage.removeItem('order_history_v2');
      localStorage.removeItem('order_history');
      setOrders([]);
    }
  };

  if (!isHydrated) return null;

  return (
    <div className="max-w-md mx-auto p-6 bg-[#050505] min-h-screen text-white flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 pt-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-orange-600">Activity</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">History</p>
        </div>
        <div className="flex gap-2">
          <button onClick={clearHistory} className="p-3 bg-white/5 rounded-2xl text-white/40 active:scale-90 transition-all">
            <Trash2 size={20} />
          </button>
          <button onClick={() => router.back()} className="p-3 bg-white/10 rounded-full text-white active:scale-90 transition-all">
            <ChevronLeft size={24} />
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 space-y-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-40 w-full bg-white/5 animate-pulse rounded-[2.5rem]" />)
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <History size={64} className="mb-4" />
            <p className="font-black uppercase text-xs tracking-widest">No Recent Orders</p>
          </div>
        ) : (
          orders.map((order) => (
            <div 
              key={order.docId} 
              className="bg-[#111111] border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                    <History size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Order No.</p>
                    <p className="text-2xl font-black text-white italic">#{order.orderId || "..."}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Total</p>
                  <p className="text-2xl font-black italic text-orange-500">₹{order.total}</p>
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-white/5 rounded-[1.5rem] p-4 mb-6">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-1">
                    <span className="text-orange-500 font-black italic text-sm">{item.quantity}x</span>
                    <p className="text-xs font-bold text-white/80 uppercase italic">{item.name}</p>
                  </div>
                ))}
              </div>

              {/* Action Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${order.status === 'READY' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${order.status === 'READY' ? 'text-green-500' : 'text-orange-500'}`}>
                     {order.status?.replace('_', ' ') || 'PENDING'}
                   </span>
                </div>
                <button 
                  onClick={() => router.push(`/status/${order.docId}`)}
                  className="flex items-center gap-1 text-orange-500 font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                >
                  Track <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Logout Button (From Screenshot) */}
      <button 
        onClick={handleLogout}
        className="mt-10 mb-6 w-full bg-red-500/10 border border-red-500/20 p-6 rounded-[2.5rem] flex items-center justify-between active:scale-95 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/40">
            <LogOut size={20} className="text-white" />
          </div>
          <span className="font-black uppercase italic tracking-widest text-red-500">Logout</span>
        </div>
        <ChevronRight size={20} className="text-red-500/40" />
      </button>

      <div className="text-center opacity-20 pb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">CampusEats • Bits Goa</p>
      </div>
    </div>
  );
}