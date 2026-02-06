'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function OrderStatus() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "orders", id), (doc) => {
      if (doc.exists()) {
        setOrder(doc.data());
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  if (loading) return (
    <div className="p-10 text-center text-gray-500 dark:bg-gray-950 min-h-screen">
      Loading Order...
    </div>
  );

  const isConfirmed = order?.status === "PAID" || order?.status === "CONFIRMED";
  const isRejected = order?.status === "REJECTED" || order?.status === "CANCELLED";

  return (
    /* 1. Background: Added dark:bg-gray-950 and text-gray-900 */
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 text-center transition-colors">
      
      {/* 2. Dynamic Icon: Updated for dark mode opacity backgrounds */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 
        ${isConfirmed 
          ? 'bg-green-100 dark:bg-green-900/30' 
          : isRejected 
          ? 'bg-red-100 dark:bg-red-900/30' 
          : 'bg-orange-100 dark:bg-orange-900/30'}`}>
        {isConfirmed ? (
          <span className="text-4xl text-green-600 dark:text-green-400">✅</span>
        ) : isRejected ? (
          <span className="text-4xl text-red-600 dark:text-red-400">❌</span>
        ) : (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 dark:border-orange-400"></div>
        )}
      </div>

      {/* 3. Text: Added dark:text-white and dark:text-gray-400 */}
      <h1 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">
        {isConfirmed ? "Order Confirmed!" : isRejected ? "Order Rejected" : "Verifying Payment..."}
      </h1>
      
      <p className="text-gray-500 dark:text-gray-400 mb-8 px-4">
        {isConfirmed 
          ? "Your order has been received at the counter. Head over to pick it up!" 
          : isRejected 
          ? "The merchant could not verify your payment. Visit the counter for help." 
          : "We are waiting for the merchant to confirm your UPI payment of ₹" + order?.total}
      </p>

      {/* 4. Order Info Card: Added dark:bg-gray-900 and dark:border-gray-800 */}
      <div className="w-full bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 mb-8">
        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 font-bold">Order Number</p>
        
        <p className="text-5xl font-black text-orange-600 dark:text-orange-500 mb-2">
          {order?.orderId ? `#${order.orderId}` : "..."}
        </p>

        <p className="text-[10px] text-gray-300 dark:text-gray-600 font-mono mt-2 truncate">Ref: {id}</p>
        
        {isRejected && (
          <p className="text-sm text-red-500 dark:text-red-400 font-medium mt-2">Refund will be processed manually if paid.</p>
        )}
      </div>

      {/* 5. Home Button: Added dark:bg-white dark:text-black for contrast */}
      <button 
        onClick={() => router.push('/eatery')}
        className="w-full bg-gray-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold hover:bg-black dark:hover:bg-gray-200 transition-colors shadow-lg"
      >
        Go Back Home
      </button>
    </div>
  );
}