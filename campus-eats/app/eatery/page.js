"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../lib/firebase'; 
import { collection, onSnapshot, doc, query } from 'firebase/firestore'; // Added collection, query
import Link from 'next/link';

export default function EateriesList() {
  const [activeOrder, setActiveOrder] = useState(null);
  const [shops, setShops] = useState([]); // State for Firebase Shops
  const [isBarVisible, setIsBarVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Fetch Shops from Firebase
    const unsubShops = onSnapshot(collection(db, "shops"), (snap) => {
      const shopsData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShops(shopsData);
    });

    // 2. Existing Order Listener
    const lastId = typeof window !== "undefined" ? localStorage.getItem('last_order_doc_id') : null;
    if (lastId) {
      const unsubOrder = onSnapshot(doc(db, "orders", lastId), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.status === "COLLECTED") {
            setActiveOrder(null);
            setIsBarVisible(false);
            localStorage.removeItem('last_order_doc_id');
          } else {
            setActiveOrder({ ...data, id: snap.id });
          }
        }
      });
      return () => { unsubShops(); unsubOrder(); };
    }

    return () => unsubShops();
  }, []);

  return (
  <div className="max-w-md mx-auto p-6 bg-gray-50 min-h-screen relative">
    <header className="mb-8 flex justify-between items-center">
      <div>
        <h1 className="text-4xl font-black text-orange-600">CampusEats</h1>
        <p className="text-gray-500 text-xs">BITS Pilani, KK Birla Goa Campus</p>
      </div>
      <button 
        onClick={() => router.push('/history')} 
        className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2"
      >
        <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">History</span>
        <span className="text-lg">🕒</span>
      </button>
    </header>

    {/* --- FLOATING LIVE ORDER BANNER --- */}
    {activeOrder && isBarVisible && (
      <div className="fixed bottom-6 left-4 right-4 bg-orange-600 text-white p-4 rounded-3xl shadow-2xl z-50 flex items-center justify-between border-2 border-orange-400 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <div className="text-left">
            <p className="text-[10px] opacity-80 uppercase font-bold tracking-widest">Order #{activeOrder.orderId}</p>
            <p className="font-bold text-sm">Status: {activeOrder.status.replace('_', ' ')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href={`/status/${activeOrder.id}`}>
            <button className="bg-white text-orange-600 px-4 py-2 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all">
              Track
            </button>
          </Link>
          
          {/* DISMISS BUTTON */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              setIsBarVisible(false);
            }}
            className="w-8 h-8 flex items-center justify-center bg-orange-700/50 rounded-full text-white/90 hover:bg-orange-800 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    )}

    {/* --- DYNAMIC EATERIES LIST FROM FIREBASE --- */}
    <div className="grid gap-4">
      {shops.map((shop) => (
        <Link key={shop.id} href={`/eatery/${shop.id}`}>
          <div className={`bg-white p-5 rounded-3xl shadow-sm border border-gray-100 transition-all active:scale-95 ${!shop.isOpen && 'opacity-60 grayscale'}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{shop.isOpen ? '🍴' : '😴'}</span>
                <div>
                  <h3 className="text-lg font-bold">{shop.name}</h3>
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-tighter">
                    {shop.isOpen ? 'Open Now' : 'Closed'}
                  </p>
                </div>
              </div>
              <span className="text-gray-300">→</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
);
}