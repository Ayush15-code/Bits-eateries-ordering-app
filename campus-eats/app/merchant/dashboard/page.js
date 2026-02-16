"use client";
import { useState, useEffect, useRef } from 'react';
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
} from 'firebase/firestore';
import ThemeToggle from '../../components/ThemeToggle';
import { Eye, X, Plus, UtensilsCrossed, Trash2 } from 'lucide-react'; 

export default function MerchantDash() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); 
  const [merchantShopId, setMerchantShopId] = useState(null);
  const [merchantUid, setMerchantUid] = useState(null); 
  const [menuItems, setMenuItems] = useState([]);
  const [shopStatus, setShopStatus] = useState(true);
  const [viewingScreenshot, setViewingScreenshot] = useState(null); 

  // Add Item State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'General' });

  const router = useRouter();
  const audioRef = useRef(null);
  const pageLoadTime = useRef(new Date()); 

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

    const qOrders = query(
      collection(db, "orders"), 
      where("shopId", "==", merchantShopId),
      where("status", "in", ["AWAITING_PAYMENT", "AWAITING_VERIFICATION", "CONFIRMED", "ACCEPTED", "COLLECTED", "REJECTED"])
    );
    
    const unsubscribeOrders = onSnapshot(qOrders, (snap) => {
      snap.docChanges().forEach((change) => {
        const orderData = change.doc.data();
        const orderTime = orderData.createdAt?.toDate ? orderData.createdAt.toDate() : new Date();
        if (change.type === "added" && orderData.status === "AWAITING_VERIFICATION" && orderTime > pageLoadTime.current) {
          audioRef.current?.play().catch(() => {});
        }
      });
      setOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    const unsubShop = onSnapshot(fireDoc(db, "shops", merchantShopId), (snap) => {
      if (snap.exists()) setShopStatus(snap.data().isOpen);
    });

    const unsubMenu = onSnapshot(fireDoc(db, "metabase", merchantUid), (snap) => {
      if (snap.exists()) setMenuItems(snap.data().items || []);
    });

    return () => {
      unsubscribeOrders();
      unsubShop();
      unsubMenu();
    };
  }, [merchantShopId, merchantUid]);

  // --- MENU ACTIONS ---
  
  const addItem = async (e) => {
    e.preventDefault();
    if (!merchantUid || !newItem.name || !newItem.price) return;
    try {
      const menuRef = fireDoc(db, "metabase", merchantUid);
      const itemToAdd = {
        ...newItem,
        id: Date.now().toString(),
        isAvailable: true,
        price: Number(newItem.price)
      };
      const updatedItems = [...menuItems, itemToAdd];
      await fireSetDoc(menuRef, { items: updatedItems }, { merge: true });
      setNewItem({ name: '', price: '', category: 'General' });
      setIsAddingItem(false);
    } catch (err) {
      alert("Error adding item: " + err.message);
    }
  };

  const toggleItem = async (itemId) => {
    if (!merchantUid) return;
    try {
      const menuRef = fireDoc(db, "metabase", merchantUid);
      const updatedItems = menuItems.map(item => {
        if (item.id === itemId) return { ...item, isAvailable: !item.isAvailable };
        return item;
      });
      await fireSetDoc(menuRef, { items: updatedItems }, { merge: true });
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // NEW: REMOVE ITEM FUNCTION
  const removeItem = async (itemId) => {
    if (!merchantUid || !confirm("Delete this item permanently?")) return;
    try {
      const menuRef = fireDoc(db, "metabase", merchantUid);
      const updatedItems = menuItems.filter(item => item.id !== itemId);
      await fireSetDoc(menuRef, { items: updatedItems }, { merge: true });
    } catch (err) {
      alert("Error deleting item: " + err.message);
    }
  };

  const toggleShop = async () => {
    if (!merchantShopId) return;
    try {
      await fireUpdateDoc(fireDoc(db, "shops", merchantShopId), { isOpen: !shopStatus });
    } catch (err) {
      console.error("Toggle Error:", err);
    }
  };

  const handlePaymentStatus = async (id, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (["CONFIRMED", "ACCEPTED"].includes(newStatus)) updateData.confirmedAt = new Date().toISOString();
      await fireUpdateDoc(fireDoc(db, "orders", id), updateData);
    } catch (err) {
      alert(err.message);
    }
  };

  const getGroupedItems = (items) => {
    return (items || []).reduce((acc, item) => {
      const name = item.name || item.itemName || "Item";
      if (acc[name]) acc[name].quantity += 1;
      else acc[name] = { name: name, quantity: 1 };
      return acc;
    }, {});
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/merchant/login');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-orange-600"></div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-gray-100 dark:bg-gray-950 min-h-screen pb-20 transition-colors">
      {/* Header UI */}
      <div className="bg-white dark:bg-gray-900 p-6 shadow-sm sticky top-0 z-10 border-b dark:border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black dark:text-white uppercase tracking-tighter">CampusEats</h1>
            <p className="text-[10px] text-orange-500 font-bold uppercase">{merchantShopId || 'No Shop linked'}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={handleLogout} className="text-[10px] font-black text-red-500 uppercase border border-red-100 dark:border-red-900/30 px-2 py-1 rounded-lg">Logout</button>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {['orders', 'history', 'manage'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg font-bold text-xs capitalize transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 shadow text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.filter(o => !['COLLECTED', 'REJECTED'].includes(o.status)).length === 0 ? (
              <div className="text-center py-20 opacity-40">
                <UtensilsCrossed className="mx-auto mb-4" size={48} />
                <p className="font-bold text-[10px] uppercase">No Active Orders</p>
              </div>
            ) : (
              orders.filter(o => !['COLLECTED', 'REJECTED'].includes(o.status)).map(o => (
                <div key={o.id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-md border-l-8 border-orange-500">
                  <div className="flex justify-between items-start">
                    <p className="font-black text-xl dark:text-white">#{o.orderId}</p>
                    <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-2 py-1 rounded-md font-bold uppercase">{o.status.replace('_', ' ')}</span>
                  </div>
                  {o.status === "AWAITING_VERIFICATION" && (
                    <button onClick={() => setViewingScreenshot(o.screenshotBase64)} className="w-full my-3 py-3 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase shadow-lg shadow-blue-500/20">View Proof</button>
                  )}
                  <div className="my-3 space-y-1 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl">
                    {Object.values(getGroupedItems(o.items)).map((item, i) => ( 
                      <p key={i} className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.quantity}x {item.name}</p>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {o.status === "AWAITING_VERIFICATION" ? (
                      <button onClick={() => handlePaymentStatus(o.id, "CONFIRMED")} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold uppercase text-[10px]">Accept Payment</button>
                    ) : (
                      <button onClick={() => handlePaymentStatus(o.id, "COLLECTED")} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold uppercase text-[10px]">Mark Collected</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border-2 transition-all ${shopStatus ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`font-black ${shopStatus ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>Store is {shopStatus ? 'OPEN' : 'CLOSED'}</h3>
                <button 
                  onClick={toggleShop} 
                  className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2 rounded-full font-black text-xs shadow-md uppercase active:scale-95 transition-all"
                >Toggle</button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Menu Items</h2>
              <button 
                onClick={() => setIsAddingItem(true)}
                className="bg-orange-600 text-white p-2 rounded-xl flex items-center gap-1 text-[10px] font-bold uppercase shadow-lg shadow-orange-500/30"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl flex justify-between items-center border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center gap-3">
                    {/* DELETE BUTTON */}
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div>
                      <p className={`font-bold dark:text-white ${!item.isAvailable ? 'opacity-40 line-through' : ''}`}>{item.name}</p>
                      <p className="text-orange-500 font-black text-xs">₹{item.price || item.Price}</p>
                    </div>
                  </div>
                  <button onClick={() => toggleItem(item.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-colors ${item.isAvailable ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                    {item.isAvailable ? '● AVAILABLE' : 'UNAVAILABLE'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black mb-6 dark:text-white uppercase tracking-tighter">Add New Item</h2>
            <form onSubmit={addItem} className="space-y-4">
              <input 
                type="text" placeholder="Item Name (e.g. Samosa)" 
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              />
              <input 
                type="number" placeholder="Price (₹)" 
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})}
              />
              <select 
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white appearance-none"
                value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}
              >
                <option value="General">General</option>
                <option value="Snacks">Snacks</option>
                <option value="Beverages">Beverages</option>
                <option value="Meals">Meals</option>
              </select>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsAddingItem(false)} className="flex-1 py-4 font-bold text-gray-400 uppercase text-xs">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-orange-500/30">Add to Menu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Screenshot */}
      {viewingScreenshot && (
        <div className="fixed inset-0 bg-black/90 z-[120] flex items-center justify-center p-6" onClick={() => setViewingScreenshot(null)}>
           <div className="relative max-w-sm w-full bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <img src={viewingScreenshot} alt="Proof" className="w-full h-auto" />
              <button onClick={() => setViewingScreenshot(null)} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full"><X size={20}/></button>
           </div>
        </div>
      )}
    </div>
  );
}