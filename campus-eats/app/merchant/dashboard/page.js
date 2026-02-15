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
  updateDoc as fireUpdateDoc,
} from 'firebase/firestore';
import ThemeToggle from '../../components/ThemeToggle';
import { Eye, X, Plus } from 'lucide-react'; 

export default function MerchantDash() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); 
  const [merchantShopId, setMerchantShopId] = useState(null);
  const [merchantUid, setMerchantUid] = useState(null); 
  const [menuItems, setMenuItems] = useState([]);
  const [shopStatus, setShopStatus] = useState(true);
  const [viewingScreenshot, setViewingScreenshot] = useState(null); 

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
          } else {
            // Agar shopId nahi hai toh loading stop karo aur error set karo
            console.error("No shopId linked to UID:", user.uid);
            setLoading(false); 
          }
        } catch (err) {
          console.error("Auth Error:", err);
          setLoading(false);
        }
      }
    });

    audioRef.current = new Audio("/notification.mp3");
    return () => unsubscribeAuth();
  }, [router]);
    
  useEffect(() => {
    if (!merchantShopId || !merchantUid) return;

    // --- ORDERS LOGIC ---
    const qOrders = query(
      collection(db, "orders"), 
      where("shopId", "==", merchantShopId),
      where("status", "in", ["AWAITING_PAYMENT", "AWAITING_VERIFICATION", "CONFIRMED", "ACCEPTED", "COLLECTED", "REJECTED"])
    );
    
    const unsubscribeOrders = onSnapshot(qOrders, (snap) => {
      snap.docChanges().forEach((change) => {
        const orderData = change.doc.data();
        const orderTime = orderData.createdAt?.toDate ? orderData.createdAt.toDate() : new Date();
        if (orderData.status === "AWAITING_VERIFICATION" && orderData.screenshotBase64 && orderTime > pageLoadTime.current) {
          audioRef.current?.play().catch(() => {});
        }
      });
      setOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    // --- SHOP STATUS LOGIC ---
    const unsubShop = onSnapshot(fireDoc(db, "shops", merchantShopId), (snap) => {
      if (snap.exists()) setShopStatus(snap.data().isOpen);
    });

    // --- MENU LOGIC (metabase collection) ---
    const unsubMenu = onSnapshot(fireDoc(db, "metabase", merchantUid), (snap) => {
      if (snap.exists()) {
        setMenuItems(snap.data().items || []);
      }
    });

    return () => {
      unsubscribeOrders();
      unsubShop();
      unsubMenu();
    };
  }, [merchantShopId, merchantUid]);

  // Toggle Single Item Availability
  const toggleItem = async (itemId) => {
    if (!merchantUid) return;
    try {
      const menuRef = fireDoc(db, "metabase", merchantUid);
      const updatedItems = menuItems.map(item => {
        if (item.id === itemId) {
          return { ...item, isAvailable: !item.isAvailable };
        }
        return item;
      });
      await fireUpdateDoc(menuRef, { items: updatedItems });
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // --- Toggle Shop Function with Guard ---
  const toggleShop = async () => {
    if (!merchantShopId) {
      alert("Error: Aapka account kisi Shop ID se juda nahi hai. Firestore check karein.");
      return;
    }
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

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-950 text-xs font-bold uppercase tracking-widest text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="max-w-md mx-auto bg-gray-100 dark:bg-gray-950 min-h-screen pb-20 transition-colors">
      {/* Header */}
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
              <p className="text-gray-400 text-center mt-10 font-bold text-[10px] uppercase">No Active Orders</p>
            ) : (
              orders.filter(o => !['COLLECTED', 'REJECTED'].includes(o.status)).map(o => (
                <div key={o.id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-md border-l-8 border-orange-500">
                  <p className="font-black text-xl dark:text-white">#{o.orderId}</p>
                  {o.status === "AWAITING_VERIFICATION" && (
                    <button onClick={() => setViewingScreenshot(o.screenshotBase64)} className="w-full my-3 py-3 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase">View Proof</button>
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
            <div className={`p-6 rounded-3xl border-2 transition-all ${shopStatus ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-center">
                <h3 className="font-black text-gray-800">Store is {shopStatus ? 'OPEN' : 'CLOSED'}</h3>
                <button 
                  onClick={toggleShop} 
                  disabled={!merchantShopId}
                  className="bg-white px-6 py-2 rounded-full font-black text-xs shadow-md uppercase active:scale-95 disabled:opacity-50"
                >
                  {merchantShopId ? 'Toggle' : 'Loading...'}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl flex justify-between items-center border dark:border-gray-800">
                  <div>
                    <p className={`font-bold dark:text-white ${!item.isAvailable ? 'opacity-40 line-through' : ''}`}>{item.name}</p>
                    <p className="text-orange-500 font-black text-xs">₹{item.Price || item.price}</p>
                  </div>
                  <button onClick={() => toggleItem(item.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.isAvailable ? '● AVAILABLE' : 'UNAVAILABLE'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal for Screenshot */}
      {viewingScreenshot && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6" onClick={() => setViewingScreenshot(null)}>
           <div className="relative max-w-sm w-full bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
              <img src={viewingScreenshot} alt="Proof" className="w-full h-auto" />
              <button onClick={() => setViewingScreenshot(null)} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full"><X size={20}/></button>
           </div>
        </div>
      )}
    </div>
  );
}