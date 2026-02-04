"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Status() {
  const router = useRouter();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!router.query.id) return;
    const unsub = onSnapshot(doc(db, "orders", router.query.id), (d) => {
      if (d.exists()) setOrder(d.data());
    });
    return () => unsub();
  }, [router.query.id]);

  if (!order) return <div className="p-10 text-center font-bold">Finding Order...</div>;

  const collected = order.status === 'COLLECTED';

  return (
    <div className={`max-w-md mx-auto min-h-screen p-10 text-center flex flex-col items-center justify-center ${collected ? 'bg-green-50' : 'bg-orange-50'}`}>
      <div className="text-7xl mb-6">{collected ? '✅' : '⏳'}</div>
      <h2 className="text-2xl font-black">Order {order.orderId}</h2>
      <div className={`mt-4 px-6 py-2 rounded-full font-bold uppercase text-sm ${collected ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'}`}>
        {order.status}
      </div>
      {!collected && <p className="mt-6 text-gray-500 font-medium">Please wait 5-10 minutes. Show this screen at the counter when called.</p>}
      {collected && <button onClick={() => router.push('/')} className="mt-8 bg-green-600 text-white px-8 py-3 rounded-xl font-bold">Back to Home</button>}
    </div>
  );
}