"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';

export default function EateriesList() {
  const [activeOrder, setActiveOrder] = useState(null);
  const [shops, setShops] = useState([]);
  const [isBarVisible, setIsBarVisible] = useState(true);
  
  // --- NEW STATES FOR LIVE CART ---
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  
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

    // 2. Fetch Live Cart from LocalStorage
    const savedCart = JSON.parse(localStorage.getItem('pending_cart') || '[]');
    const savedTotal = localStorage.getItem('pending_total') || '0';
    setCart(savedCart);
    setCartTotal(Number(savedTotal));

    // 3. Existing Order Listener
    const lastId = typeof window !== "undefined" ? localStorage.getItem('last_order_doc_id') : null;
    let unsubOrder = () => {};

    if (lastId) {
      unsubOrder = onSnapshot(doc(db, "orders", lastId), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.status === "COLLECTED" || data.status === "ARCHIVED") {
            setActiveOrder(null);
            setIsBarVisible(false);
            localStorage.removeItem('last_order_doc_id');
          } else {
            setActiveOrder({ ...data, id: snap.id });
          }
        }
      });
    }

    return () => { 
      unsubShops(); 
      unsubOrder(); 
    };
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-950 min-h-screen relative text-gray-900 dark:text-gray-100">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-orange-600">CampusEats</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs">BITS Pilani, Goa Campus</p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => router.push('/history')}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-2"
          >
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">History</span>
            <span className="text-lg">🕒</span>
          </button>
        </div>
      </header>

      {/* --- LIVE ORDER TRACKER --- */}
{activeOrder && isBarVisible && !['COLLECTED', 'REJECTED', 'ARCHIVED'].includes(activeOrder.status) && (
  <div className="fixed bottom-32 left-0 right-0 z-50 px-4 flex justify-center">
    <div className="w-full max-w-md bg-orange-600 text-white p-4 rounded-[2.5rem] shadow-2xl flex items-center justify-between border-2 border-orange-400 animate-in fade-in slide-in-from-bottom-4 transition-all">
      <div className="flex items-center gap-3 pl-2">
        {/* Status Indicator Dot */}
        <div className={`w-3 h-3 rounded-full animate-pulse ${
          activeOrder.status === 'CONFIRMED' ? 'bg-green-300' : 'bg-white'
        }`} />
        
        <div className="text-left">
          <p className="text-[10px] opacity-90 uppercase font-black tracking-widest leading-tight">
            Order #{activeOrder.orderId}
          </p>
          <p className="font-bold text-sm tracking-tight capitalize">
            {activeOrder.status.toLowerCase().replace('_', ' ')}...
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/status/${activeOrder.id}`}>
          <button className="bg-white text-orange-600 px-6 py-2.5 rounded-2xl font-black text-xs shadow-md active:scale-95 transition-transform">
            TRACK
          </button>
        </Link>
        <button 
          onClick={() => setIsBarVisible(false)} 
          className="w-10 h-10 flex items-center justify-center bg-black/10 hover:bg-black/20 rounded-full transition-colors"
        >
          <span className="text-xs">✕</span>
        </button>
      </div>
    </div>
  </div>
)}

      {/* --- NEW: LIVE CART BANNER --- */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-0 right-0 z-50 px-4 flex justify-center">
          <div className="w-full max-w-md bg-green-600 dark:bg-green-700 text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-4">
            <div className="flex flex-col pl-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Unplaced Cart</span>
              <span className="font-black text-sm">{cart.length} Items • ₹{cartTotal}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if(confirm("Clear cart?")) {
                    localStorage.removeItem('pending_cart');
                    localStorage.removeItem('pending_total');
                    localStorage.removeItem('pending_shop_id');
                    setCart([]);
                  }
                }}
                className="bg-black/10 p-2.5 rounded-2xl active:scale-90"
              >
                🗑️
              </button>
              <button 
                onClick={() => router.push('/checkout')}
                className="bg-white text-green-600 px-6 py-2.5 rounded-2xl font-black text-xs shadow-sm active:scale-95"
              >
                Checkout →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EATERIES LIST --- */}
      <div className="grid gap-4 mb-20">
        {shops.map((shop) => (
          <Link key={shop.id} href={`/eatery/${shop.id}`}>
            <div className={`bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all active:scale-95 ${!shop.isOpen && 'opacity-60 grayscale'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{shop.isOpen ? '🍴' : '😴'}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{shop.name}</h3>
                    <p className={`text-xs font-bold uppercase tracking-tighter ${shop.isOpen ? 'text-green-500' : 'text-gray-400'}`}>
                      {shop.isOpen ? 'Open Now' : 'Closed'}
                    </p>
                  </div>
                </div>
                <span className="text-gray-300 dark:text-gray-600 font-bold text-xl">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}