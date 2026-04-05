"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import InstallButton from '../components/InstallButton';
import { Clock, X, ChevronRight, Menu as MenuIcon, ReceiptText, Trash2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
// sdvdrgtgegrh
export default function EateriesList() {
  const [shops, setShops] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]); // Changed from activeOrder (null) to activeOrders ([])
  
  const router = useRouter();

  // --- 1. AUTO-DELETE HISTORY (12 HOURS LOGIC) ---
  useEffect(() => {
    const cleanOldHistory = () => {
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      const now = Date.now();
      
      ['order_history', 'order_history_v2'].forEach(key => {
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        if (history.length > 0) {
          const updated = history.filter(order => {
            if (!order.timestamp) return true;
            return (now - order.timestamp) < TWELVE_HOURS;
          });

          if (updated.length !== history.length) {
            localStorage.setItem(key, JSON.stringify(updated));
            if (key === 'order_history_v2' || (key === 'order_history' && !localStorage.getItem('order_history_v2'))) {
              setOrderHistory(updated);
            }
          }
        }
      });
    };

    cleanOldHistory();
    const interval = setInterval(cleanOldHistory, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      try {
        await signOut(auth);
        document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        setCart([]);
        setCartTotal(0);
        localStorage.clear();
        window.location.href = "/";
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
  };

  useEffect(() => {
    const unsubShops = onSnapshot(collection(db, "shops"), (snap) => {
      const shopsData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShops(shopsData);
    });

    const savedCart = JSON.parse(localStorage.getItem('pending_cart') || '[]');
    const savedTotal = localStorage.getItem('pending_total') || '0';
    const savedHistoryV2 = JSON.parse(localStorage.getItem('order_history_v2') || '[]');
    const savedHistoryLegacy = JSON.parse(localStorage.getItem('order_history') || '[]');
    const fullHistory = savedHistoryV2.length > 0 ? savedHistoryV2 : savedHistoryLegacy;

    setCart(savedCart);
    setCartTotal(Number(savedTotal));
    setOrderHistory(fullHistory);

    // --- MULTI-ORDER LISTENER LOGIC ---
    // Track all orders from history that aren't collected/rejected and are from the last 12 hours
    const trackedOrders = fullHistory.filter(order => 
      order.status !== 'COLLECTED' && 
      order.status !== 'REJECTED' &&
      (!order.timestamp || (Date.now() - order.timestamp < 12 * 60 * 60 * 1000))
    );

    const activeOrdersMap = {};
    const unsubs = trackedOrders.map(order => {
      const docId = order.docId || order.id;
      if (!docId) return null;

      return onSnapshot(doc(db, "orders", docId), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          // If order is now completed or rejected, remove it from the slider
          if (data.status === 'COLLECTED' || data.status === 'REJECTED') {
            delete activeOrdersMap[docId];
          } else {
            activeOrdersMap[docId] = { docId: snap.id, ...data };
          }
          setActiveOrders(Object.values(activeOrdersMap));
        }
      });
    }).filter(Boolean);

    return () => {
      unsubShops();
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  const clearCart = (e) => {
    e.stopPropagation();
    if (confirm("Clear all items from your tray?")) {
      setCart([]);
      setCartTotal(0);
      localStorage.removeItem('pending_cart');
      localStorage.removeItem('pending_total');
      localStorage.removeItem('pending_shop_id');
    }
  };

  const clearHistory = () => {
    if (confirm("Delete all order history? This cannot be undone.")) {
      localStorage.removeItem('order_history');
      localStorage.removeItem('order_history_v2');
      setOrderHistory([]);
      setActiveOrders([]); // Reset slider
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-950 min-h-screen relative text-gray-900 dark:text-gray-100 transition-colors flex flex-col">
      {/* --- SIDEBAR DRAWER (ORIGINAL) --- */}
      <div className={`fixed inset-0 z-100 transition-visibility ${isSidebarOpen ? 'visible' : 'invisible'}`}>
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
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {orderHistory.length > 0 ? [...orderHistory].map((order, idx) => {
                const isObject = typeof order === 'object' && order !== null;
                const orderId = isObject ? (order.docId || order.id) : order;
                const displayNum = isObject && (order.orderId || order.orderNumber) ? (order.orderId || order.orderNumber) : (orderHistory.length - idx);
                const orderTotal = isObject ? (order.total || order.totalPrice) : null;
                const orderItems = isObject ? (order.items || []) : [];
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsSidebarOpen(false);
                      router.push(`/status/${orderId}`);
                    }}
                    className="p-5 bg-gray-50 dark:bg-white/5 rounded-4xl flex flex-col gap-3 group cursor-pointer border border-transparent hover:border-orange-500/20 transition-all active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600">
                          <ReceiptText size={18} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest leading-none mb-1">Order No.</p>
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
                    {orderItems.length > 0 && (
                      <div className="bg-white/40 dark:bg-black/20 p-3 rounded-2xl space-y-1">
                        {orderItems.map((item, iIdx) => (
                          <p key={iIdx} className="text-[10px] font-bold dark:text-gray-300 flex items-center">
                            <span className="text-orange-600 mr-2">{item.quantity}x</span>
                            <span className="uppercase tracking-tight">
                              {item.name} {item.category && item.category !== "General" ? item.category : ""}
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
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

            <div className="mt-auto pt-6 border-t border-gray-100 dark:border-white/5 space-y-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-[1.8rem] transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-600/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest">Logout</span>
                </div>
                <ChevronRight size={14} className="opacity-40" />
              </button>
              <p className="text-[8px] font-black text-gray-500 text-center uppercase tracking-[0.4em] opacity-60">CampusEats • BITS Goa</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
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
        <div className="grid gap-5 mb-8">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Available Eateries</p>
          {shops.map((shop) => (
            <Link key={shop.id} href={`/eatery/${shop.id}`}>
              <div className={`bg-white dark:bg-gray-900 p-5 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 transition-all active:scale-[0.98] group ${!shop.isOpen && 'opacity-60 grayscale'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-3xl ${shop.isOpen ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
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

      <footer className="fixed bottom-0 left-0 right-0 z-[30] py-4 text-center bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md border-t border-gray-100 dark:border-white/5 mx-auto max-w-md">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 mb-0.5">Designed & Developed by</p>
        <p className="text-[11px] font-semibold text-orange-600 italic mb-2">Tushar Nandal & Ayush Ranjan</p>
        <div className="inline-block px-3 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/5">
          <p className="text-[8px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">Built with love in <span className="text-orange-600">AH9</span></p>
        </div>
      </footer>
      </div>

      {/* --- UPDATED FLOATING STATUS SLIDER --- */}
      <div className="h-28" />
      
      {activeOrders.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 z-40">
           {/* no-scrollbar and snap-x allow horizontal swiping */}
           <div className="flex overflow-x-auto gap-4 px-6 pb-4 no-scrollbar snap-x">
            {activeOrders.map((order) => (
              <div
                key={order.docId || order.id}
                onClick={() => router.push(`/status/${order.docId || order.id}`)}
                className="min-w-[85%] bg-orange-600 p-4 rounded-4xl shadow-2xl flex items-center justify-between snap-center active:scale-95 transition-all cursor-pointer border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl">
                    <Clock className="text-white animate-pulse" size={20} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/60 uppercase tracking-widest">
                      Active Order • Token #{order.orderId || (order.docId || order.id)?.slice(-3).toUpperCase()}
                    </p>
                    <p className="text-white font-black italic uppercase text-xs">
                      Status: {order.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-white/40" size={20} />
              </div>
            ))}
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <div className="fixed bottom-10 left-0 right-0 px-6 z-50 flex justify-center">
          <div className="w-full max-w-md bg-orange-600 text-white p-5 rounded-[2.8rem] shadow-[0_20px_50px_rgba(249,115,22,0.4)] flex items-center justify-between relative overflow-visible">
            <button
              onClick={clearCart}
              className="absolute -top-2 -right-1 w-7 h-7 bg-white text-orange-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-100 transition-colors z-20"
            >
              <X size={14} strokeWidth={3} />
            </button>
            <div className="flex flex-col pl-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-0.5">Your Tray</span>
              <span className="font-black text-lg italic">{cart.length} Items • ₹{cartTotal}</span>
            </div>
            <button
              onClick={() => router.push('/checkout')}
              className="bg-white text-orange-600 px-10 py-4 rounded-[1.8rem] font-black text-[12px] uppercase tracking-widest active:scale-95 transition-transform"
            >
              Checkout →
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ea580c; border-radius: 10px; }
        /* Hide scrollbar logic for the sliding status bar */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}