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

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Order...</div>;

  // Status Checks
  const isConfirmed = order?.status === "PAID" || order?.status === "CONFIRMED";
  const isRejected = order?.status === "REJECTED" || order?.status === "CANCELLED";

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      
      {/* Dynamic Icon */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 
        ${isConfirmed ? 'bg-green-100' : isRejected ? 'bg-red-100' : 'bg-orange-100'}`}>
        {isConfirmed ? (
          <span className="text-4xl text-green-600">✅</span>
        ) : isRejected ? (
          <span className="text-4xl text-red-600">❌</span>
        ) : (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        )}
      </div>

      <h1 className="text-2xl font-black mb-2 text-gray-900">
        {isConfirmed ? "Order Confirmed!" : isRejected ? "Order Rejected" : "Payment Pending..."}
      </h1>
      
      <p className="text-gray-500 mb-8 px-4">
        {isConfirmed 
          ? "Your order has been received at the counter. Head over to pick it up!" 
          : isRejected 
          ? "The merchant could not verify your payment or is out of stock. Please visit the counter for help." 
          : "Please wait while the merchant verifies your payment notification."}
      </p>

      {/* Order Info Card */}
      <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">Order Details</p>
        <p className="font-mono font-bold text-gray-800 mb-2 truncate">{id}</p>
        {isRejected && (
          <p className="text-sm text-red-500 font-medium">Refund will be processed manually if paid.</p>
        )}
      </div>

      <button 
        onClick={() => router.push('/eatery')}
        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-colors shadow-lg"
      >
        Go Back Home
      </button>
    </div>
  );
}