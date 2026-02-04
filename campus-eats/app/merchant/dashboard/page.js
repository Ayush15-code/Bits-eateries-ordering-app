"use client";
import { useEffect, useState, useRef } from 'react';
import { db, auth } from '@/lib/firebase'; // Ensure this path is correct
import { useRouter } from 'next/navigation'; // Important: use navigation
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function MerchantDash() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const audioRef = useRef(null);

  useEffect(() => {
    // 1. Check if Merchant is logged in
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/merchant/login');
      } else {
        setLoading(false);
      }
    });

    // 2. Setup Audio & Listen for Orders
    audioRef.current = new Audio("/notification.mp3");
    const q = query(collection(db, "orders"), where("status", "==", "PAID"));
    
    const unsubscribeOrders = onSnapshot(q, (snap) => {
      if (snap.docChanges().some(c => c.type === "added")) {
        audioRef.current.play().catch(() => console.log("Click page to enable sound"));
      }
      setOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeOrders();
    };
  }, [router]);

  const markCollected = async (id) => {
    await updateDoc(doc(db, "orders", id), { status: "COLLECTED" });
  };

  if (loading) return <p className="p-10 text-center text-gray-500">Verifying session...</p>;

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Active Orders</h1>
      {orders.length === 0 ? <p className="text-gray-400">Waiting for orders...</p> : 
        orders.map(o => (
          <div key={o.id} className="bg-white p-5 rounded-2xl shadow-sm mb-4 border-l-4 border-orange-500">
            <p className="font-black text-lg">{o.orderId}</p>
            <p className="text-sm mb-4">{o.items.map(i => i.name).join(', ')}</p>
            <button onClick={() => markCollected(o.id)} className="w-full bg-green-500 text-white py-3 rounded-xl font-bold">
              Collected
            </button>
          </div>
        ))
      }
    </div>
  );
}