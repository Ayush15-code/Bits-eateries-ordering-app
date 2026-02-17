"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import ThemeToggle from '../../components/ThemeToggle';
import { Eye, EyeOff, X, UtensilsCrossed, ChevronDown, Edit3, History, Trash2 } from 'lucide-react';

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
  const pageLoadTime = useRef(new Date());
  const [historyOrders, setHistoryOrders] = useState([]);

  const getGroupedItems = (items) => {
    return (items || []).reduce((acc, item) => {
      // Handle different naming conventions like 'name' or 'itemName'
      const name = item.name || item.itemName || "Item";
      // Get the quantity value, defaulting to 1 if it's a single entry
      const qty = Number(item.quantity || item.Quantity || item.qty || 1);

      if (acc[name]) {
        acc[name].quantity += qty;
      } else {
        acc[name] = { name: name, quantity: qty };
      }
      return acc;
    }, {});
  };

  useEffect(() => {
    if (!merchantShopId || activeTab !== 'history') return;

    // 1. Calculate the time 2 hours ago
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    // 2. Add the timestamp filter to the query
    const qHistory = query(
      collection(db, "orders"),
      where("shopId", "==", merchantShopId),
      where("status", "in", ["COLLECTED", "REJECTED"]),
      // This line ensures you only read data from the last 2 hours
      where("createdAt", ">=", twoHoursAgo),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribeHistory = onSnapshot(qHistory, (snap) => {
      console.log("History documents found:", snap.size);
      setHistoryOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (err) => {
      console.error("Firestore Index Error:", err.message);
    });

    return () => unsubscribeHistory();
  }, [merchantShopId, activeTab]);

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
            setLoading(false);
          } else {
            setLoading(false);
          }
        } catch (err) {
          setLoading(false);
        }
      }
    });
    audioRef.current = new Audio("/notification.mp3");
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!merchantShopId || !merchantUid) return;

    // Listen to Active Orders
    const qOrders = query(
      collection(db, "orders"),
      where("shopId", "==", merchantShopId),
      where("status", "in", ["AWAITING_PAYMENT", "AWAITING_VERIFICATION", "CONFIRMED", "ACCEPTED", "COLLECTED", "REJECTED"])
    );

    const unsubscribeOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    // Listen to Shop Status
    const unsubShop = onSnapshot(fireDoc(db, "shops", merchantShopId), (snap) => {
      if (snap.exists()) setShopStatus(snap.data().isOpen);
    });

    // Listen to Menu and Visibility
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
      unsubShop();
      unsubMenu();
    };
  }, [merchantShopId, merchantUid]);

  const groupedItems = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [menuItems]);

  const toggleAllCategories = (isOpen) => {
    const newState = {};
    Object.keys(groupedItems).forEach(cat => newState[cat] = isOpen);
    setOpenCategories(newState);
  };

  const toggleCategoryVisibility = async (catName) => {
    const isCurrentlyHidden = hiddenCategories.includes(catName);
    const newHiddenList = isCurrentlyHidden
      ? hiddenCategories.filter(c => c !== catName)
      : [...hiddenCategories, catName];

    setHiddenCategories(newHiddenList);
    await fireSetDoc(fireDoc(db, "metabase", merchantUid), { hiddenCategories: newHiddenList }, { merge: true });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!merchantUid || !editingItemId) return;
    const updatedItems = menuItems.map(item =>
      item.id === editingItemId ? { ...item, ...editItem, price: Number(editItem.price) } : item
    );
    await fireSetDoc(fireDoc(db, "metabase", merchantUid), { items: updatedItems }, { merge: true });
    setIsEditingItem(false);
    setEditingItemId(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-950"><div className="animate-spin rounded-full h-10 w-10 border-t-4 border-orange-600"></div></div>;

  return (
    <div className="max-w-md mx-auto bg-gray-100 dark:bg-gray-950 min-h-screen pb-20">
      <div className="bg-white dark:bg-gray-900 p-6 shadow-sm sticky top-0 z-10 border-b dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-black dark:text-white uppercase tracking-tighter text-orange-600">CampusEats</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase">{merchantShopId}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={() => signOut(auth)} className="text-[10px] font-black text-red-500 uppercase border border-red-100 dark:border-red-900/30 px-2 py-1 rounded-lg">Logout</button>
          </div>
        </div>

        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {['orders', 'history', 'manage'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg font-bold text-xs capitalize transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.filter(o => !['COLLECTED', 'REJECTED'].includes(o.status)).length === 0 ? (
              <div className="text-center py-20 opacity-40"><UtensilsCrossed className="mx-auto mb-4" size={48} /><p className="font-bold text-[10px] uppercase">No Active Orders</p></div>
            ) : (
              orders.filter(o => !['COLLECTED', 'REJECTED'].includes(o.status)).map(o => (
                <div key={o.id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-md border-l-8 border-orange-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-xl dark:text-white">#{o.orderId || o.id.slice(0, 5)}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{o.userName || 'BITS Student'}</p>
                    </div>
                    <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-2 py-1 rounded-md font-bold uppercase">{o.status}</span>
                  </div>

                  {/* Order Contents Section */}
                  {/* Order Contents Section */}
                  {/* Updated Order Contents Section for the Orders Tab */}
                  <div className="my-4 space-y-2 border-y border-gray-50 dark:border-gray-800 py-3">
                    {Object.values(getGroupedItems(o.items)).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <p className="text-sm font-bold dark:text-gray-200">
                          <span className="text-orange-600 mr-2">{item.quantity}x</span>
                          {item.name}
                        </p>
                        {/* Note: Price here would be for a single unit; 
          you can multiply by item.quantity if you want the subtotal */}
                      </div>
                    ))}
                    <div className="pt-2 flex justify-between items-center border-t border-dashed border-gray-200 dark:border-gray-700">
                      <span className="text-[10px] font-black uppercase text-gray-400">Total Bill</span>
                      <span className="font-black text-orange-600">₹{o.total}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {o.status === "AWAITING_VERIFICATION" && (
                      <button onClick={() => setViewingScreenshot(o.screenshotBase64)} className="w-full py-3 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase shadow-lg shadow-blue-500/20">View Payment Proof</button>
                    )}
                    <div className="flex gap-2">
                      {o.status === "AWAITING_VERIFICATION" ? (
                        <button onClick={() => fireUpdateDoc(fireDoc(db, "orders", o.id), { status: "CONFIRMED" })} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold uppercase text-[10px]">Accept Payment</button>
                      ) : (
                        <button onClick={() => fireUpdateDoc(fireDoc(db, "orders", o.id), { status: "COLLECTED" })} className="flex-1 bg-gray-900 dark:bg-white dark:text-black text-white py-3 rounded-xl font-bold uppercase text-[10px]">Mark Collected</button>
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
              <div className="text-center py-20 opacity-40">
                <History className="mx-auto mb-4" size={48} />
                <p className="font-bold text-[10px] uppercase">No History Found</p>
              </div>
            ) : (
              historyOrders.map(o => (
                <div key={o.id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border-l-8 border-gray-300 dark:border-gray-700 opacity-80">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-lg dark:text-white">#{o.orderId || o.id.slice(0, 5)}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">{o.userName || 'Student'}</p>
                    </div>
                    <span className={`text-[9px] px-2 py-1 rounded-md font-bold uppercase ${o.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                      {o.status}
                    </span>
                  </div>

                  {/* FIXED: Universal quantity check */}
                  {/* Updated History Tab rendering */}
                  <div className="mt-2 text-[11px] font-bold text-gray-500">
                    {Object.values(getGroupedItems(o.items))
                      .map(i => `${i.quantity}x ${i.name}`)
                      .join(', ')}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {/* --- MANAGE TAB --- */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border-2 transition-all ${shopStatus ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`font-black ${shopStatus ? 'text-green-800 dark:text-green-400' : 'text-red-800'}`}>Store {shopStatus ? 'OPEN' : 'CLOSED'}</h3>
                <button onClick={() => fireUpdateDoc(fireDoc(db, "shops", merchantShopId), { isOpen: !shopStatus })} className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2 rounded-full font-black text-xs uppercase shadow-md">Toggle Status</button>
              </div>
            </div>

            <div className="flex justify-start items-center gap-2">
              <button onClick={() => toggleAllCategories(true)} className="text-[8px] font-black uppercase text-orange-600 border border-orange-100 px-2 py-1 rounded-md">Expand All</button>
              <button onClick={() => toggleAllCategories(false)} className="text-[8px] font-black uppercase text-gray-400 border border-gray-100 px-2 py-1 rounded-md">Collapse All</button>
            </div>

            <div className="space-y-4">
              {Object.keys(groupedItems).sort().map(cat => (
                <div key={cat} className="bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="w-full flex justify-between items-center p-5 bg-gray-50/50 dark:bg-gray-800/30">
                    <button onClick={() => setOpenCategories(p => ({ ...p, [cat]: !p[cat] }))} className="flex items-center gap-2">
                      <ChevronDown size={18} className={`transition-transform ${openCategories[cat] ? 'rotate-180' : ''} text-gray-400`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">{cat} ({groupedItems[cat].length})</span>
                    </button>
                    <button onClick={() => toggleCategoryVisibility(cat)} className={`flex items-center gap-1 px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all ${hiddenCategories.includes(cat) ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {hiddenCategories.includes(cat) ? <><EyeOff size={12} /> Hidden</> : <><Eye size={12} /> Visible</>}
                    </button>
                  </div>

                  {openCategories[cat] && (
                    <div className="p-2 space-y-2">
                      {groupedItems[cat].map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <button onClick={() => { setEditItem({ name: item.name, price: item.price || item.Price, category: item.category || 'General' }); setEditingItemId(item.id); setIsEditingItem(true); }} className="text-gray-300 hover:text-blue-500 transition-colors"><Edit3 size={16} /></button>
                            <div><p className={`font-bold text-sm dark:text-white ${!item.isAvailable ? 'opacity-40 line-through' : ''}`}>{item.name}</p><p className="text-orange-500 font-black text-[10px]">₹{item.price || item.Price}</p></div>
                          </div>
                          <button onClick={() => fireSetDoc(fireDoc(db, "metabase", merchantUid), { items: menuItems.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i) }, { merge: true })} className={`px-4 py-2 rounded-xl text-[9px] font-black ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{item.isAvailable ? 'AVAILABLE' : 'HIDDEN'}</button>
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
            <h2 className="text-2xl font-black mb-6 dark:text-white uppercase tracking-tighter">Edit Item</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input type="text" placeholder="Item Name" className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none dark:text-white" value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} />
              <input type="number" placeholder="Price (₹)" className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none dark:text-white" value={editItem.price} onChange={(e) => setEditItem({ ...editItem, price: e.target.value })} />
              <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none dark:text-white appearance-none" value={editItem.category} onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}>
                {["Burger", "Shawarma", "Maggi", "Rice", "Fries", "Momos", "Roll", "Omelette", "Sandwich", "Protein", "Tandoori", "Maincourse", "Shake", "Juice", "Dosa", "QuickBites", "HotBeverages", "ColdBeverages"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2 pt-4"><button type="button" onClick={() => setIsEditingItem(false)} className="flex-1 py-4 font-bold text-gray-400 uppercase text-xs">Cancel</button><button type="submit" className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs">Update</button></div>
            </form>
          </div>
        </div>
      )}

      {viewingScreenshot && (
        <div className="fixed inset-0 bg-black/90 z-[120] flex items-center justify-center p-6" onClick={() => setViewingScreenshot(null)}>
          <div className="relative max-w-sm w-full bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <img src={viewingScreenshot} alt="Proof" className="w-full h-auto" />
            <button onClick={() => setViewingScreenshot(null)} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full"><X size={20} /></button>
          </div>
        </div>
      )}
    </div>
  );
}