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
    const historyIds = JSON.parse(localStorage.getItem('order_history') || '[]');
    
    const orderDetails = await Promise.all(
      historyIds.map(async (id) => {
        const docSnap = await getDoc(doc(db, "orders", id));
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
      })
    );

    setOrders(orderDetails.filter(o => o !== null));
    setLoading(false);
  };

  const clearHistory = () => {
    if (confirm("Clear all order history?")) {
      localStorage.removeItem('order_history');
      setOrders([]);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => router.back()} className="text-gray-600">← Back</button>
        <h1 className="text-xl font-black">Order History</h1>
        <button onClick={clearHistory} className="text-red-500 text-sm font-bold">Clear</button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 mt-10">Loading history...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400">No recent orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order.id}
              onClick={() => router.push(`/status/${order.id}`)}
              className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer"
            >
              <div>
                <p className="font-black text-lg">Order #{order.orderId}</p>
                <p className="text-xs text-gray-400">{order.dateStr}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-600">₹{order.total}</p>
                <p className="text-[10px] uppercase font-bold text-gray-400">{order.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}