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

// Added Download icon here
import { Eye, EyeOff, X, UtensilsCrossed, ChevronDown, Edit3, History, Trash2, Clock, User, Hash, Download } from 'lucide-react';

export default function MerchantDash() {
  // --- 1. ALL HOOKS ---
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [merchantShopId, setMerchantShopId] = useState(null);
  const [merchantUid, setMerchantUid] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [shopStatus, setShopStatus] = useState(true);
  // Updated state to hold both image data and order reference for the filename
  const [viewingScreenshot, setViewingScreenshot] = useState(null);
  const [openCategories, setOpenCategories] = useState({});
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editItem, setEditItem] = useState({ name: '', price: '', category: '' });
  const [editingItemId, setEditingItemId] = useState(null);
  const [historyOrders, setHistoryOrders] = useState([]);

  const router = useRouter();
  const audioRef = useRef(null);

  // Auth & Role Verification Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = document.cookie.split('; ').find(row => row.startsWith('userRole='))?.split('=')[1];
        if (role === 'merchant') {
          setIsAuthorized(true);
          setMerchantUid(user.uid);
          
          if ('serviceWorker' in navigator && 'Notification' in window) {
            Notification.requestPermission();
            navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Error', err));
          }

          try {
            const userDoc = await fireGetDoc(fireDoc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().shopId) {
              setMerchantShopId(userDoc.data().shopId);
            }
            setLoading(false);
          } catch (err) {
            setLoading(false);
          }
        } else {
          router.push('/merchant/login');
        }
      } else {
        router.push('/merchant/login');
      }
    });

    audioRef.current = new Audio("/notification.mp3");
    return () => unsubscribe();
  }, [router]);

  // Real-time Listeners - BUDGET OPTIMIZED
  useEffect(() => {
    if (!merchantShopId || !merchantUid) return;

    // --- 1. ACTIVE ORDERS (Added Limit 100 to prevent bot-read-spikes) ---
    const qOrders = query(
      collection(db, "orders"),
      where("shopId", "==", merchantShopId),
      where("status", "in", ["AWAITING_VERIFICATION", "CONFIRMED", "ACCEPTED"]),
      limit(100) // ✅ SAFETY: Caps the cost if orders spike
    );

    const unsubscribeOrders = onSnapshot(qOrders, (snap) => {
      const updatedOrders = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setOrders(updatedOrders);

      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const orderData = change.doc.data();
          const orderTime = orderData.createdAt?.toMillis() || Date.now();
          if (Date.now() - orderTime < 30000) {
            if (audioRef.current) audioRef.current.play().catch(e => {});
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'NEW_ORDER',
                title: 'Naya Order Aaya Hai! 🍔',
                body: `Order ID: #${orderData.orderId || change.doc.id.slice(0, 5)}`
              });
            }
          }
        }
      });
    });

    // --- 2. HISTORY ORDERS (Conditional Listener - Only runs if tab is active) ---
    let unsubscribeHistory = () => {}; 
    if (activeTab === 'history') {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      const qHistory = query(
        collection(db, "orders"),
        where("shopId", "==", merchantShopId),
        where("status", "in", ["COLLECTED", "REJECTED"]),
        where("createdAt", ">=", twoHoursAgo),
        orderBy("createdAt", "desc"),
        limit(40) // ✅ SAFETY: Limit history reads
      );
      
      unsubscribeHistory = onSnapshot(qHistory, (snap) => {
        setHistoryOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      });
    }

    // --- 3. SHOP & MENU (Stay as they are, but keep cleanup) ---
    const unsubShop = onSnapshot(fireDoc(db, "shops", merchantShopId), (snap) => {
      if (snap.exists()) setShopStatus(snap.data().isOpen);
    });

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

    // --- 4. CLEANUP (The "Money Saver") ---
    return () => {
      unsubscribeOrders();
      unsubscribeHistory();
      unsubShop();
      unsubMenu();
    };
    // Added activeTab to dependencies so history listener starts/stops when you switch tabs
  }, [merchantShopId, merchantUid, activeTab]);

  const groupedItemsMemo = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [menuItems]);

  // --- 2. UI HANDLERS ---
  const handleTabChange = (tab) => {
    if (tab === 'orders') {
      setActiveTab(tab);
      return;
    }

    const confirmMessage = tab === 'history' 
      ? "Do you want to open history?" 
      : "Do you want to open manager tab?";

    if (window.confirm(confirmMessage)) {
      setActiveTab(tab);
    }
  };

  // Helper function to handle image download
  const downloadScreenshot = (base64Data, orderId) => {
    const link = document.createElement("a");
    link.href = base64Data;
    link.download = `Order_${orderId}_Payment.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  // --- 3. CONDITIONAL RENDERS ---
  if (!isAuthorized) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center font-black text-orange-600">VERIFYING...</div>;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-gray-950 font-black text-orange-600">LOADING...</div>;
  }

  return (
    <div
      className="max-w-md mx-auto bg-gray-100 dark:bg-gray-950 min-h-screen pb-20"
      onClick={() => {
        if (audioRef.current) {
          audioRef.current.play().then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }).catch(() => { });
        }
      }}
    >
      {/* HEADER */}
      <div className="bg-white dark:bg-gray-900 p-6 shadow-sm sticky top-0 z-10 border-b dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black text-orange-600 italic uppercase tracking-tighter">CampusEats</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={() => signOut(auth)} className="text-[10px] font-black text-red-500 uppercase border border-red-100 px-2 py-1 rounded-lg">Logout</button>
          </div>
        </div>
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {['orders', 'history', 'manage'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => handleTabChange(tab)} 
              className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-gray-500'}`}
            >
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
              [...orders].reverse().map(o => (
                <div key={o.id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-md border-l-8 border-orange-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-black text-2xl dark:text-white italic">#{o.orderId || o.id.slice(0, 5)}</p>
                      <p className="text-[11px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-1">
                        <User size={14} />
                        {o.userName ? o.userName : "Name Not Provided"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] bg-orange-100 text-orange-600 px-2 py-1 rounded-md font-black uppercase tracking-widest block mb-1">{o.status.replace("_", " ")}</span>
                      <p className="font-black text-lg text-orange-600">₹{o.total || o.totalPrice || 0}</p>
                    </div>
                  </div>

                  <div className="my-4 space-y-2 border-y dark:border-gray-800 py-4">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <p className="text-sm font-bold dark:text-gray-200">
                          <span className="text-orange-600 mr-2">{item.quantity}x</span>
                          {item.name} {item.category && item.category !== "General" ? item.category : ""}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {o.status === "AWAITING_VERIFICATION" && (
                      <button 
                        // Passing an object to help identify the file for download
                        onClick={() => setViewingScreenshot({ data: o.screenshotBase64, id: o.orderId || o.id.slice(0,5) })} 
                        className="w-full py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
                      >
                        View Payment Proof
                      </button>
                    )}
                    <div className="flex gap-2">
                      {o.status === "AWAITING_VERIFICATION" ? (
                        <>
                          <button onClick={() => fireUpdateDoc(fireDoc(db, "orders", o.id), { status: "CONFIRMED" })} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform">Accept Payment</button>
                          <button onClick={() => { if (window.confirm("Reject this order?")) fireUpdateDoc(fireDoc(db, "orders", o.id), { status: "REJECTED" }); }} className="px-4 bg-red-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest">Reject</button>
                        </>
                      ) : (
                        o.status !== "COLLECTED" && (
                          <button onClick={() => fireUpdateDoc(fireDoc(db, "orders", o.id), { status: "COLLECTED", collectedAt: new Date() })} className="flex-1 bg-gray-900 dark:bg-white dark:text-black text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest">Mark Collected</button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyOrders.length === 0 ? (
              <div className="text-center py-20 opacity-20 italic"><History size={48} className="mx-auto mb-4" /><p className="text-[10px] font-black uppercase">No History for Today</p></div>
            ) : (
              historyOrders.map((o) => (
                <div key={o.id} className={`bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border shadow-sm ${o.status === 'REJECTED' ? 'border-red-500/20' : 'border-gray-100 dark:border-gray-800'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-black italic dark:text-white">#{o.orderId || o.id?.slice(-4).toUpperCase()}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{o.userName || "Unknown Student"}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest block mb-1 ${o.status === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-green-100 text-green-600'}`}>{o.status}</span>
                      <p className="font-black text-sm dark:text-white">₹{o.total || o.totalPrice || 0}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-3xl mb-4 bg-gray-50 dark:bg-gray-800/40">
                      {o.items?.map((item, idx) => (
                        <p key={idx} className="text-sm font-bold dark:text-gray-200">
                          <span className="text-orange-600 mr-2">{item.quantity}x</span>
                          {item.name}
                        </p>
                      ))}
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(o.createdAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {o.collectedAt && <span className="text-green-600">Picked: {new Date(o.collectedAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- MANAGE TAB --- */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border-2 ${shopStatus ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-center">
                <h3 className="font-black uppercase text-[10px] tracking-widest">Store {shopStatus ? 'Online' : 'Offline'}</h3>
                <button onClick={() => fireUpdateDoc(fireDoc(db, "shops", merchantShopId), { isOpen: !shopStatus })} className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2 rounded-full font-black text-[10px] uppercase shadow-md">Toggle Status</button>
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
                    <button onClick={() => toggleCategoryVisibility(cat)} className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${hiddenCategories.includes(cat) ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{hiddenCategories.includes(cat) ? 'Hidden' : 'Visible'}</button>
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
                          <button onClick={() => fireSetDoc(fireDoc(db, "metabase", merchantUid), { items: menuItems.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i) }, { merge: true })} className={`px-4 py-2 rounded-xl text-[9px] font-black ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{item.isAvailable ? 'AVAILABLE' : 'OFF'}</button>
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

      {/* ENHANCED VIEW SCREENSHOT MODAL WITH DOWNLOAD */}
      {viewingScreenshot && (
        <div className="fixed inset-0 bg-black/95 z-[120] flex flex-col items-center justify-center p-6" onClick={() => setViewingScreenshot(null)}>
          <div className="relative max-w-sm w-full bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={viewingScreenshot.data} alt="Proof" className="w-full h-auto max-h-[70vh] object-contain" />
            <div className="p-4 flex gap-3">
               <button 
                onClick={() => downloadScreenshot(viewingScreenshot.data, viewingScreenshot.id)} 
                className="flex-1 bg-orange-600 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
              >
                <Download size={14} /> Save to Gallery
              </button>
              <button 
                onClick={() => setViewingScreenshot(null)} 
                className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}