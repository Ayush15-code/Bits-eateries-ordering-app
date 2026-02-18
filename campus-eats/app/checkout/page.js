"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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

// --- FIXED PATHS ---
import { auth, db } from '../lib/firebase';
import ThemeToggle from '../components/ThemeToggle'; // One level up from checkout to app/components

// Combined Icons - No duplicates
import { 
  Eye, EyeOff, X, UtensilsCrossed, ChevronDown, 
  Edit3, History, Clock, User, Hash 
} from 'lucide-react';

export default function MerchantDash() {
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [merchantShopId, setMerchantShopId] = useState(null);
  const [merchantUid, setMerchantUid] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [shopStatus, setShopStatus] = useState(true);
  const [openCategories, setOpenCategories] = useState({});

  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editItem, setEditItem] = useState({ name: '', price: '', category: '' });
  const [editingItemId, setEditingItemId] = useState(null);

  const router = useRouter();

  // Helper for grouping items inside orders
  const getGroupedItems = (items) => {
    return (items || []).reduce((acc, item) => {
      const name = item.name || item.itemName || "Item";
      const qty = Number(item.quantity || item.qty || 1);
      if (acc[name]) { acc[name].quantity += qty; } 
      else { acc[name] = { name, quantity: qty }; }
      return acc;
    }, {});
  };

  // 1. Auth & Initial Load
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
        } catch (err) {
          setLoading(false);
        }
      }
    });
    return unsubscribeAuth;
  }, [router]);

  // 2. Real-time Listeners
  useEffect(() => {
    if (!merchantShopId || !merchantUid) return;

    const qOrders = query(
      collection(db, "orders"),
      where("shopId", "==", merchantShopId),
      where("status", "in", ["AWAITING_PAYMENT", "AWAITING_VERIFICATION", "CONFIRMED", "ACCEPTED"])
    );
    const unsubscribeOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const qHistory = query(
      collection(db, "orders"),
      where("shopId", "==", merchantShopId),
      where("status", "in", ["COLLECTED", "REJECTED"]),
      where("createdAt", ">=", oneHourAgo),
      orderBy("createdAt", "desc"),
      limit(25)
    );
    const unsubscribeHistory = onSnapshot(qHistory, (snap) => {
      setHistoryOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

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

    return () => {
      unsubscribeOrders();
      unsubscribeHistory();
      unsubShop();
      unsubMenu();
    };
  }, [merchantShopId, merchantUid]);

  const groupedMenuItems = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [menuItems]);

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

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-950 font-black text-orange-600 uppercase">Loading Dashboard...</div>;

  return (
    <div className="max-w-md mx-auto bg-gray-100 dark:bg-gray-950 min-h-screen pb-20">
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
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-20 opacity-40"><UtensilsCrossed className="mx-auto mb-4" size={48} /><p className="font-bold text-[10px] uppercase">No Active Orders</p></div>
            ) : (
              orders.map(o => (
                <div key={o.id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-md border-l-8 border-orange-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-black text-2xl dark:text-white italic">#{o.orderId || o.id.slice(0, 5)}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1 mt-1">
                        <Clock size={12}/> {o.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <span className="text-[9px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-2 py-1 rounded-md font-black uppercase tracking-tighter">{o.status}</span>
                  </div>
                  
                  <div className="my-4 space-y-2 border-y border-gray-100 dark:border-gray-800 py-3">
                    {Object.values(getGroupedItems(o.items)).map((item, idx) => (
                      <p key={idx} className="text-sm font-bold dark:text-gray-200">
                        <span className="text-orange-600 mr-2">{item.quantity}x</span>{item.name}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mb-4 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border dark:border-gray-700">
                    <User size={14} className="text-gray-400"/>
                    <div className="overflow-hidden">
                       <p className="text-[9px] font-black text-gray-500 uppercase truncate">{o.userName || 'Student'}</p>
                       <p className="text-[8px] font-mono text-blue-500 truncate tracking-tighter">ID: {o.userId}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {o.status === "AWAITING_VERIFICATION" ? (
                      <button onClick={() => fireUpdateDoc(fireDoc(db, "orders", o.id), { status: "CONFIRMED" })} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-black uppercase text-[10px]">Accept Payment</button>
                    ) : (
                      <button onClick={() => fireUpdateDoc(fireDoc(db, "orders", o.id), { status: "COLLECTED", collectedAt: new Date() })} className="flex-1 bg-gray-900 dark:bg-white dark:text-black text-white py-4 rounded-xl font-black uppercase text-[10px]">Mark Collected</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <p className="text-[9px] font-black text-gray-400 uppercase text-center mb-2 tracking-widest">Automatic Cleanup: Last 1 Hour</p>
            {historyOrders.map(o => (
              <div key={o.id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm opacity-80">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-lg dark:text-white italic">#{o.orderId}</h3>
                  <p className="font-black text-green-600">₹{o.total}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl mb-3 border dark:border-gray-700">
                  <p className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1"><User size={10}/> {o.userName}</p>
                  <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300">{Object.values(getGroupedItems(o.items)).map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-gray-100 dark:border-gray-800">
                  <span className="text-[8px] font-black text-gray-400 uppercase">Placed: {o.createdAt?.toDate().toLocaleTimeString()}</span>
                  <span className="text-[8px] font-black text-green-500 uppercase text-right">Picked</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border-2 transition-colors ${shopStatus ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'bg-red-50 border-red-200 dark:bg-red-900/20'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`font-black uppercase text-[11px] tracking-widest ${shopStatus ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>Store {shopStatus ? 'Online' : 'Offline'}</h3>
                <button 
                  onClick={() => fireUpdateDoc(fireDoc(db, "shops", merchantShopId), { isOpen: !shopStatus })}
                  className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2 rounded-full font-black text-[10px] uppercase active:scale-95 transition-transform"
                >
                  Toggle Status
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {Object.keys(groupedMenuItems).sort().map(cat => (
                <div key={cat} className="bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex justify-between items-center p-5 bg-gray-50/50 dark:bg-gray-800/30">
                    <button onClick={() => setOpenCategories(p => ({ ...p, [cat]: !p[cat] }))} className="flex items-center gap-2">
                      <ChevronDown size={18} className={`transition-transform ${openCategories[cat] ? 'rotate-180' : ''} text-orange-600`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">{cat}</span>
                    </button>
                    <button onClick={() => toggleCategoryVisibility(cat)} className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${hiddenCategories.includes(cat) ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {hiddenCategories.includes(cat) ? 'Hidden' : 'Visible'}
                    </button>
                  </div>
                  {openCategories[cat] && (
                    <div className="p-2 space-y-2">
                      {groupedMenuItems[cat].map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <button onClick={() => { setEditItem({ name: item.name, price: item.price || item.Price, category: item.category || 'General' }); setEditingItemId(item.id); setIsEditingItem(true); }} className="text-gray-400 hover:text-orange-500 transition-colors"><Edit3 size={16} /></button>
                            <div>
                              <p className={`font-bold text-sm dark:text-white ${!item.isAvailable ? 'opacity-40 line-through' : ''}`}>{item.name}</p>
                              <p className="text-orange-500 font-black text-[10px]">₹{item.price || item.Price}</p>
                            </div>
                          </div>
                          <button onClick={() => fireSetDoc(fireDoc(db, "metabase", merchantUid), { items: menuItems.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i) }, { merge: true })} className={`px-4 py-2 rounded-xl text-[9px] font-black transition-colors ${item.isAvailable ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
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

      {/* EDIT MODAL */}
      {isEditingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black mb-6 dark:text-white uppercase tracking-tighter italic">Edit Item</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Item Name</label>
                <input type="text" className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl outline-none dark:text-white border focus:border-orange-500 border-transparent transition-colors" value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Price (₹)</label>
                <input type="number" className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl outline-none dark:text-white border focus:border-orange-500 border-transparent transition-colors" value={editItem.price} onChange={(e) => setEditItem({ ...editItem, price: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsEditingItem(false)} className="flex-1 font-black text-gray-400 uppercase text-[10px]">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-orange-600/20 active:scale-95 transition-transform">Update Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}