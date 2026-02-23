"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../../components/ThemeToggle';
import { auth, db } from '../../lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc as fireDoc,
  getDoc as fireGetDoc,
  setDoc as fireSetDoc,
  updateDoc as fireUpdateDoc,
  limit,
  orderBy
} from 'firebase/firestore';

import { Eye, EyeOff, X, UtensilsCrossed, ChevronDown, Edit3, History, Trash2, Clock, User, Hash } from 'lucide-react';

export default function MerchantDash() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [merchantShopId, setMerchantShopId] = useState(null);
  const [merchantUid, setMerchantUid] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [shopStatus, setShopStatus] = useState(true);
  const [viewingScreenshot, setViewingScreenshot] = useState(null);
  const [openCategories, setOpenCategories] = useState({});

  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editItem, setEditItem] = useState({ name: '', price: '', category: '' });
  const [editingItemId, setEditingItemId] = useState(null);

  const router = useRouter();
  const audioRef = useRef(null);
  const [historyOrders, setHistoryOrders] = useState([]);
  

  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log("Wake Lock failed");
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    });

    requestWakeLock();

    return () => {
      // Clean up: stop wake lock when component unmounts
      if (wakeLock !== null) {
        wakeLock.release().then(() => { wakeLock = null; });
      }
    };
  }, []);


  

  useEffect(() => {
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    const checkInactivity = () => {
      const lastActive = localStorage.getItem('lastActive');
      if (lastActive && Date.now() - parseInt(lastActive) > TWO_HOURS) {
        // Logout if inactive for 2 hours
        auth.signOut();
        localStorage.clear();
        window.location.href = '/login';
      }
    };

    const updateActivity = () => {
      localStorage.setItem('lastActive', Date.now().toString());
    };

    // Track interactions
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('keydown', updateActivity);

    // Har 1 minute mein check karega background mein
    const interval = setInterval(checkInactivity, 60000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      clearInterval(interval);
    };
  }, []);
  

  // Helper for grouping items
  const getGroupedItems = (items) => {
    return (items || []).reduce((acc, item) => {
      const name = item.name || item.itemName || "Item";
      const qty = Number(item.quantity || item.Quantity || item.qty || 1);
      if (acc[name]) { acc[name].quantity += qty; }
      else { acc[name] = { name: name, quantity: qty }; }
      return acc;
    }, {});
  };

  // Auth Effect
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/merchant/login');
      } else {
        setMerchantUid(user.uid);
        try {
          const userDoc = await fireGetDoc(fireDoc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().shopId) {
            setMerchantShopId(userDoc.data().shopId);
          }
          setLoading(false);
        } catch (err) { setLoading(false); }
      }
    });
    audioRef.current = new Audio("/notification.mp3");
    return () => unsubscribeAuth();
  }, [router]);
  

  // Real-time Listeners
  useEffect(() => {
    if (!merchantShopId || !merchantUid) return;

    // Active Orders
    // Inside MerchantDash.js
    const qOrders = query(
      collection(db, "orders"),
      where("shopId", "==", merchantShopId),
      // Explicitly list only the statuses the merchant should see
      where("status", "in", ["AWAITING_VERIFICATION", "CONFIRMED", "ACCEPTED"])
    );
    
    const unsubscribeOrders = onSnapshot(qOrders, (snap) => {
  // --- SOUND LOGIC START ---
  snap.docChanges().forEach((change) => {
    if (change.type === "added") {
      const orderData = change.doc.data();
      
      // Order ka timestamp check karein (taaki purane orders par sound na baje)
      const orderTime = orderData.createdAt?.toMillis() || Date.now();
      const now = Date.now();

      // Agar order pichle 30 seconds mein aaya hai toh sound bajayein
      if (now - orderTime < 30000) {
        if (audioRef.current) {
          audioRef.current.play().catch(err => {
            console.log("Autoplay blocked: Click on dashboard to enable sound.");
          });
        }
      }
    }
  });
  // --- SOUND LOGIC END ---

  setOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
});

    // History (Last 2 Hours)
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    const qHistory = query(
      collection(db, "orders"),
      where("shopId", "==", merchantShopId),
      where("status", "in", ["COLLECTED", "REJECTED"]),
      where("createdAt", ">=", twoHoursAgo),
      orderBy("createdAt", "desc"),
      limit(25)
    );
    const unsubscribeHistory = onSnapshot(qHistory, (snap) => {
      setHistoryOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    // Shop Status
    const unsubShop = onSnapshot(fireDoc(db, "shops", merchantShopId), (snap) => {
      if (snap.exists()) setShopStatus(snap.data().isOpen);
    });

    // Menu Logic
    const unsubMenu = onSnapshot(fireDoc(db, "metabase", merchantUid), (snap) => {
      if (snap.exists()) {
        const items = snap.data().items || [];
        setMenuItems(items);
        setHiddenCategories(snap.data().hiddenCategories || []);
        const cats = [...new Set(items.map(i => i.category || 'General'))];
        const catState = {};
        cats.forEach(c => catState[c] = true);
        setOpenCategories(prev => ({ ...catState, ...prev }));
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeHistory();
      unsubShop();
      unsubMenu();
    };
  }, [merchantShopId, merchantUid]);

  const groupedItemsMemo = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [menuItems]);

  const toggleAllCategories = (isOpen) => {
    const newState = {};
    Object.keys(groupedItemsMemo).forEach(cat => newState[cat] = isOpen);
    setOpenCategories(newState);
  };

  const toggleCategoryVisibility = async (catName) => {
    const isCurrentlyHidden = hiddenCategories.includes(catName);
    const newHiddenList = isCurrentlyHidden ? hiddenCategories.filter(c => c !== catName) : [...hiddenCategories, catName];
    await fireSetDoc(fireDoc(db, "metabase", merchantUid), { hiddenCategories: newHiddenList }, { merge: true });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const updatedItems = menuItems.map(item =>
      item.id === editingItemId ? { ...item, ...editItem, price: Number(editItem.price) } : item
    );
    await fireSetDoc(fireDoc(db, "metabase", merchantUid), { items: updatedItems }, { merge: true });
    setIsEditingItem(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-950 font-black text-orange-600">LOADING...</div>;

  return (
    <div 
      className="max-w-md mx-auto bg-gray-100 dark:bg-gray-950 min-h-screen pb-20"
      onClick={() => {
        // Browser Autoplay Fix: Prime the audio on first interaction
        if (audioRef.current) {
          audioRef.current.play().then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }).catch(() => {});
        }
      }}
    >
      {/* HEADER */}
      <div className="bg-white dark:bg-gray-900 p-6 shadow-sm sticky top-0 z-10 border-b dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black text-orange-600 italic uppercase">CampusEats</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={() => signOut(auth)} className="text-[10px] font-black text-red-500 uppercase border border-red-100 px-2 py-1 rounded-lg">Logout</button>
          </div>
        </div>
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {['orders', 'history', 'manage'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-20 opacity-40"><UtensilsCrossed className="mx-auto mb-4" size={48} /><p className="font-bold text-[10px] uppercase">No Active Orders</p></div>
            ) : (
              orders.map(o => (
                <div key={o.id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-md border-l-8 border-orange-500">
                  <div className="flex justify-between items-start">
                    {/* Inside the Orders Tab map */}
                    <div>
                      <p className="font-black text-xl dark:text-white italic">#{o.orderId || o.id.slice(0, 5)}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-1">
                        <User size={12} />
                        {/* Highlighted Fix: Check for userName specifically */}
                        {o.userName ? o.userName : "Name Not Provided"}
                      </p>
                    </div>
                    <span className="text-[9px] bg-orange-100 text-orange-600 px-2 py-1 rounded-md font-black uppercase">{o.status}</span>
                  </div>

                  {/* Inside the Orders Tab map in MerchantDash */}
                  {/* Inside the Orders Tab map in MerchantDash */}
                  {/* Inside the Order Card */}
                  <div className="flex justify-between items-center bg-orange-50 dark:bg-orange-950/20 p-3 rounded-2xl mb-3 border border-orange-100 dark:border-orange-900/30">
                    <div>
                      <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Verification Code</p>
                      <p className="text-xl font-black text-orange-700 dark:text-orange-400">CE-{o.verificationCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Match this with</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase text-orange-600">Screenshot note</p>
                    </div>
                  </div>
                  <div className="my-4 space-y-2 border-y dark:border-gray-800 py-3">
                    {/* getGroupedItems ko bypass karke direct items use kar rahe hain brackets se bachne ke liye */}
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold dark:text-gray-200">
                            <span className="text-orange-600 mr-2">{item.quantity}x</span>
                            {/* Item name aur Category ko bina brackets ke merge kar rahe hain */}
                            {item.name} {item.category && item.category !== "General" ? item.category : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {o.status === "AWAITING_VERIFICATION" && (
                      <button onClick={() => setViewingScreenshot(o.screenshotBase64)} className="w-full py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">View Payment Proof</button>
                    )}
                    <div className="flex gap-2">
                      {o.status === "AWAITING_VERIFICATION" ? (
                        <button onClick={() => fireUpdateDoc(fireDoc(db, "orders", o.id), { status: "CONFIRMED" })} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest">Accept Payment</button>
                      ) : (
                        <button onClick={() => fireUpdateDoc(fireDoc(db, "orders", o.id), { status: "COLLECTED", collectedAt: new Date() })} className="flex-1 bg-gray-900 dark:bg-white dark:text-black text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest">Mark Collected</button>
                      )}
                    </div>
                  </div>


                </div>
              ))
            )}
          </div>
        )}

        {/* --- Merchant History Tab Section --- */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyOrders.map((o) => (
              <div key={o.id} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black italic dark:text-white">#{o.orderId}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{o.userName}</p>
                  </div>
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-600 px-3 py-1 rounded-full text-[8px] font-black uppercase">Collected</span>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-3xl mb-4">
                  {/* CHANGE HERE: direct o.items use kar rahe hain brackets bypass karne ke liye */}
                  {o.items.map((item, idx) => (
                    <p key={idx} className="text-sm font-bold dark:text-gray-200">
                      <span className="text-orange-600 mr-2">{item.quantity}x</span>
                      {/* Name aur Category ko merge kar rahe hain bina brackets ke */}
                      {item.name} {item.category && item.category !== "General" ? item.category : ""}
                    </p>
                  ))}
                </div>

                <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                  <span>Placed: {new Date(o.createdAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-green-600">Picked: {new Date(o.collectedAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- MANAGE TAB --- */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border-2 ${shopStatus ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`font-black uppercase text-[10px] tracking-widest ${shopStatus ? 'text-green-800' : 'text-red-800'}`}>Store {shopStatus ? 'Online' : 'Offline'}</h3>

                <button
                  onClick={() => {
                    if (!merchantShopId) {
                      alert("Shop ID not loaded yet!");
                      return;
                    }
                    fireUpdateDoc(fireDoc(db, "shops", merchantShopId), { isOpen: !shopStatus });
                  }}
                  className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2 rounded-full font-black text-[10px] uppercase shadow-md"
                >
                  Toggle Status
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => toggleAllCategories(true)} className="text-[8px] font-black uppercase text-orange-600 border border-orange-100 px-3 py-1 rounded-lg">Expand All</button>
              <button onClick={() => toggleAllCategories(false)} className="text-[8px] font-black uppercase text-gray-400 border border-gray-100 px-3 py-1 rounded-lg">Collapse All</button>
            </div>

            <div className="space-y-4">
              {Object.keys(groupedItemsMemo).sort().map(cat => (
                <div key={cat} className="bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center p-5 bg-gray-50/50 dark:bg-gray-800/30">
                    <button onClick={() => setOpenCategories(p => ({ ...p, [cat]: !p[cat] }))} className="flex items-center gap-2">
                      <ChevronDown size={18} className={`transition-transform ${openCategories[cat] ? 'rotate-180' : ''} text-orange-600`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">{cat} ({groupedItemsMemo[cat].length})</span>
                    </button>
                    <button onClick={() => toggleCategoryVisibility(cat)} className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${hiddenCategories.includes(cat) ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {hiddenCategories.includes(cat) ? 'Hidden' : 'Visible'}
                    </button>
                  </div>
                  {openCategories[cat] && (
                    <div className="p-2 space-y-2">
                      {groupedItemsMemo[cat].map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <button onClick={() => { setEditItem({ name: item.name, price: item.price || item.Price, category: item.category || 'General' }); setEditingItemId(item.id); setIsEditingItem(true); }} className="text-gray-300 hover:text-blue-500"><Edit3 size={16} /></button>
                            <div>
                              <p className={`font-bold text-sm dark:text-white ${!item.isAvailable ? 'opacity-40 line-through' : ''}`}>{item.name}</p>
                              <p className="text-orange-500 font-black text-[10px]">₹{item.price || item.Price}</p>
                            </div>
                          </div>
                          <button onClick={() => fireSetDoc(fireDoc(db, "metabase", merchantUid), { items: menuItems.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i) }, { merge: true })} className={`px-4 py-2 rounded-xl text-[9px] font-black ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {item.isAvailable ? 'AVAILABLE' : 'OFF'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {isEditingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 dark:text-white uppercase tracking-tighter italic">Edit Item</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input type="text" className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl outline-none dark:text-white" value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} />
              <input type="number" className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl outline-none dark:text-white" value={editItem.price} onChange={(e) => setEditItem({ ...editItem, price: e.target.value })} />
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsEditingItem(false)} className="flex-1 font-bold text-gray-400 uppercase text-xs">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingScreenshot && (
        <div className="fixed inset-0 bg-black/90 z-[120] flex items-center justify-center p-6" onClick={() => setViewingScreenshot(null)}>
          <div className="relative max-w-sm w-full bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={viewingScreenshot} alt="Proof" className="w-full h-auto" />
            <button onClick={() => setViewingScreenshot(null)} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full"><X size={20} /></button>
          </div>
        </div>
      )}
    </div>
  );
}