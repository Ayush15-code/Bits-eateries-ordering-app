'use client';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      // Look for the array of IDs we just set in Checkout
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
            console.error(`Error fetching order ${id}:`, err);
            return null;
          }
        })
      );

      // Filter out nulls and sort by date (newest first)
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
    if (confirm("This will hide your past orders from this device. Continue?")) {
      localStorage.removeItem('order_history');
      setOrders([]);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => router.back()} className="text-orange-600 dark:text-orange-500 font-bold flex items-center gap-1">
          <span>←</span> Back
        </button>
        <h1 className="text-xl font-black dark:text-white">Order History</h1>
        <button onClick={clearHistory} className="text-red-500 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-xl">
          Clear
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 w-full bg-gray-100 dark:bg-gray-900 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">📜</div>
          <p className="text-gray-400 dark:text-gray-600 italic">No recent orders found on this device.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order.id}
              onClick={() => router.push(`/status/${order.id}`)}
              className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center cursor-pointer active:scale-95 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <p className="font-black text-lg dark:text-white leading-none">Order #{order.orderId}</p>
                   <span className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                    {order.status?.replace('_', ' ')}
                   </span>
                </div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 capitalize">
                  {order.shopId?.replace('-', ' ')}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{order.dateStr}</p>
              </div>
              
              <div className="text-right">
                <p className="font-black text-gray-900 dark:text-white">₹{order.total}</p>
                <p className="text-[10px] text-orange-600 font-bold mt-1">Reorder →</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}