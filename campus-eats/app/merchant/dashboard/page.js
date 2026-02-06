"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
// Ensure the path to firebase is correct - you are 2 levels deep now!
import { db, auth } from '../../lib/firebase'; 
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function MerchantDash() {
  // 1. Define State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 2. Define Hooks (This fixes your 'router' error)
  const router = useRouter();
  const audioRef = useRef(null);

  useEffect(() => {
    // 3. Auth Logic
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/merchant/login');
      } else {
        setLoading(false);
      }
    });

    // 4. Audio setup
    audioRef.current = new Audio("/notification.mp3");

    // 5. Setup Firebase Listener
    const q = query(
      collection(db, "orders"), 
      where("status", "in", ["AWAITING_PAYMENT", "PAID"]) 
    );
    
    const unsubscribeOrders = onSnapshot(q, (snap) => {
      if (snap.docChanges().some(c => c.type === "added")) {
        audioRef.current?.play().catch(() => console.log("User interaction needed for sound"));
      }
      setOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeOrders();
    };
  }, [router]);

  // Handle Payment Confirmation
  const handlePaymentStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: newStatus });
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  if (loading) return <p className="p-10 text-center text-gray-500">Verifying session...</p>;

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Store Dashboard</h1>
      
      {orders.length === 0 ? (
        <p className="text-gray-400 text-center mt-10">No orders to process</p>
      ) : (
        orders.map(o => (
          <div key={o.id} className="bg-white p-5 rounded-2xl shadow-md mb-4 border-l-8 border-orange-500">
            <div className="flex justify-between items-start mb-2">
              <p className="font-black text-xl text-gray-800">{o.orderId || "New Order"}</p>
              <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-md font-bold uppercase">
                {o.status?.replace('_', ' ')}
              </span>
            </div>
            
            <p className="text-gray-600 mb-1 font-semibold">Total: ₹{o.total}</p>
            <p className="text-sm text-gray-500 mb-4 pb-4 border-b">
               {o.items?.map(i => i.name).join(', ')}
            </p>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handlePaymentStatus(o.id, "CONFIRMED")} 
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-sm"
              >
                Accept Payment
              </button>
              <button 
                onClick={() => handlePaymentStatus(o.id, "REJECTED")} 
                className="px-4 bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-200"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}