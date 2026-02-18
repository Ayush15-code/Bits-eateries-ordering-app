"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import InstallButton from '../components/InstallButton'; 
import { Clock, X, ChevronRight, Menu as MenuIcon, ReceiptText, Trash2 } from 'lucide-react';

export default function EateriesList() {
  const [shops, setShops] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  
  const router = useRouter();

  useEffect(() => {
    // Real-time listener for shops
    const unsubShops = onSnapshot(collection(db, "shops"), (snap) => {
      const shopsData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShops(shopsData);
    });

    // Hydrating state from localStorage
    const savedCart = JSON.parse(localStorage.getItem('pending_cart') || '[]');
    const savedTotal = localStorage.getItem('pending_total') || '0';
    const savedHistory = JSON.parse(localStorage.getItem('order_history') || '[]');
    
    setCart(savedCart);
    setCartTotal(Number(savedTotal));
    setOrderHistory(savedHistory);

    return () => unsubShops();
  }, []);

  const clearHistory = () => {
    if (confirm("Delete all order history? This cannot be undone.")) {
      localStorage.removeItem('order_history');
      setOrderHistory([]);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-950 min-h-screen relative text-gray-900 dark:text-gray-100 transition-colors">
      
      {/* --- SIDEBAR DRAWER --- */}
      <div className={`fixed inset-0 z-[100] transition-visibility ${isSidebarOpen ? 'visible' : 'invisible'}`}>
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsSidebarOpen(false)}
        />
        <div className={`absolute top-0 left-0 h-full w-[85%] max-w-xs bg-white dark:bg-[#0d0d0d] shadow-2xl transition-transform duration-500 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} border-r dark:border-white/5`}>
          <div className="p-6 h-full flex flex-col">
            
            <div className="flex justify-between items-center mb-8 pt-2">
              <div>
                <h2 className="text-xl font-black text-orange-600 uppercase tracking-tighter italic">Activity</h2>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">History</p>
              </div>
              <div className="flex items-center gap-2">
                {orderHistory.length > 0 && (
                  <button onClick={clearHistory} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 size={18} />
                  </button>
                )}
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-gray-50 dark:bg-white/5 rounded-full">
                  <X size={20}/>
                </button>
              </div>
            </div>

            {/* --- ORDER HISTORY LIST --- */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {orderHistory.length > 0 ? [...orderHistory].map((order, idx) => {
                const isObject = typeof order === 'object' && order !== null;
                const orderId = isObject ? order.id : order;
                
                // Prioritizing the saved orderNumber
                const displayNum = isObject && order.orderNumber ? order.orderNumber : (orderHistory.length - idx);
                const orderTotal = isObject ? (order.total || order.totalPrice) : null;

                return (
                  <div 
                    key={idx} 
                    onClick={() => router.push(`/status/${orderId}`)} 
                    className="p-5 bg-gray-50 dark:bg-white/5 rounded-[2.2rem] flex flex-col gap-3 group cursor-pointer border border-transparent hover:border-orange-500/20 transition-all active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600">
                          <ReceiptText size={18} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 text-orange-500">Order No.</p>
                          <span className="text-base font-black dark:text-gray-200 tracking-tighter italic">#{displayNum}</span>
                        </div>
                      </div>
                      {orderTotal && (
                        <div className="text-right">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                          <span className="text-sm font-black text-orange-600 italic">₹{orderTotal}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-100 dark:border-white/5">
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                        ID: {orderId?.slice(-4).toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1 text-orange-600">
                        <span className="text-[9px] font-black uppercase tracking-widest font-mono">TRACK</span>
                        <ChevronRight size={12} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-20 opacity-20">
                  <Clock size={48} className="mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">No History</p>
                </div>
              )}
            </div>
            
            {/* --- PROFESSIONAL LOGOUT BUTTON (DEEP DOWN) --- */}
            <div className="mt-auto pt-6 border-t border-gray-100 dark:border-white/5 space-y-4">
              <button 
                onClick={() => {
                  if(confirm("Are you sure you want to logout? This will clear your cart and history.")) {
                    localStorage.clear(); 
                    window.location.href = "/";
                  }
                }}
                className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 rounded-[1.8rem] transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-600/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest">Logout Account</span>
                </div>
                <ChevronRight size={14} className="opacity-40 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-[8px] font-black text-gray-500 text-center uppercase tracking-[0.4em] opacity-60">CampusEats • BITS Goa</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- HEADER --- */}
      <header className="mb-12">
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="w-12 h-12 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-700 dark:text-white active:scale-90 transition-all">
            <MenuIcon size={24} strokeWidth={2.5} />
          </button>

          <div className="text-center flex-1">
            <h1 className="text-3xl font-black text-orange-600 tracking-tighter leading-none italic">CampusEats</h1>
            <p className="text-gray-500 dark:text-gray-400 text-[8px] font-black uppercase tracking-[0.2em] mt-1">BITS GOA</p>
          </div>

          <div className="flex items-center gap-2">
            <InstallButton /> 
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* --- EATERIES LIST --- */}
      <div className="grid gap-5 mb-24">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Available Eateries</p>
        {shops.map((shop) => (
          <Link key={shop.id} href={`/eatery/${shop.id}`}>
            <div className={`bg-white dark:bg-gray-900 p-5 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 transition-all active:scale-[0.98] group ${!shop.isOpen && 'opacity-60 grayscale'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-3xl ${shop.isOpen ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    {shop.isOpen ? '🍴' : '😴'}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">{shop.name}</h3>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${shop.isOpen ? 'text-green-500' : 'text-gray-400'}`}>
                      {shop.isOpen ? '● Open Now' : 'Closed'}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* --- CART BANNER --- */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-0 right-0 z-50 px-4 flex justify-center">
          <div className="w-full max-w-md bg-black dark:bg-white text-white dark:text-black p-5 rounded-[2.5rem] shadow-2xl flex items-center justify-between border border-white/10">
            <div className="flex flex-col pl-2">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Pending Tray</span>
              <span className="font-black text-base italic">{cart.length} Items • ₹{cartTotal}</span>
            </div>
            <button onClick={() => router.push('/checkout')} className="bg-orange-600 text-white px-8 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
              Checkout →
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ea580c; border-radius: 10px; }
      `}</style>
    </div>
  );
}