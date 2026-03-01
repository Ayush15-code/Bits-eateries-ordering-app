'use client';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trash2, History, Clock, ChevronRight } from 'lucide-react';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const historyIds = JSON.parse(localStorage.getItem('order_history') || '[]');
      if (historyIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const orderDetails = await Promise.all(
        historyIds.map(async (id) => {
          try {
            const docSnap = await getDoc(doc(db, "orders", id));
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
          } catch (err) {
            return null;
          }
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

  const clearHistory = () => {
    if (window.confirm("Clear all order history from this device?")) {
      localStorage.removeItem('order_history');
      setOrders([]);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-[#050505] min-h-screen text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 pt-4">
        <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-2xl text-white/60 active:scale-90 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter">Activity</h1>
        <button onClick={clearHistory} className="p-3 bg-red-500/10 rounded-2xl text-red-500 active:scale-90 transition-all">
          <Trash2 size={18} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 w-full bg-white/5 animate-pulse rounded-[2.5rem]" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
          <History size={64} className="mb-4" />
          <p className="font-black uppercase text-xs tracking-widest">No Recent Orders</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order.id}
              onClick={() => router.push(`/order-status/${order.id}`)}
              className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem] active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Order No.</p>
                  {/* FIX: Using order.orderId or fallback to Short ID (GEIW) */}
                  <p className="text-xl font-black text-white italic">
                    #{order.orderId || order.id?.toUpperCase() || "..."}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black italic text-orange-500">₹{order.total || 0}</p>
                  <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase mt-1 inline-block
                    ${order.status === 'REJECTED' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                    {order.status?.replace('_', ' ') || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Items Summary */}
              <div className="bg-white/5 rounded-2xl p-3 flex justify-between items-center">
                <div className="flex flex-col">
                   {order.items?.map((item, idx) => (
                     <p key={idx} className="text-[11px] font-bold text-white/70">
                       <span className="text-orange-500 mr-1">{item.quantity}x</span> {item.name}
                     </p>
                   ))}
                </div>
                <ChevronRight size={16} className="text-white/20" />
              </div>
              
              <p className="text-[9px] font-bold text-white/20 uppercase mt-4 tracking-widest">
                ID: {order.id} • {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}