"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
// FIX: Using 3 sets of dots to reach the lib folder from app/merchant/dashboard
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
  orderBy
} from 'firebase/firestore';

export default function MerchantDash() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); 
  
  const [merchantShopId, setMerchantShopId] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [shopStatus, setShopStatus] = useState(true);

  const router = useRouter();
  const audioRef = useRef(null);

  // STEP 1: AUTH & SHOP IDENTIFICATION
  // NEW LOGIC: Real-time Order Listener
// --- OLD LOGIC (Keep it exactly as it was, just ensure imports are correct) ---
useEffect(() => {
  const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    console.log("Checking Auth State...");
    if (!user) {
      console.log("No user found, redirecting to login");
      router.push('/merchant/login');
    } else {
      try {
        console.log("Logged in UID:", user.uid);
        const userDoc = await fireGetDoc(fireDoc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log("Firestore User Data:", data);
          setMerchantShopId(data.shopId);
        } else {
          console.error("CRITICAL: No document found in 'users' collection with ID:", user.uid);
          alert(`Access Denied: Please create a document in the 'users' collection named exactly: ${user.uid}`);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      } finally {
        setLoading(false); // This removes the "Verifying Session" screen
      }
    }
  });

  audioRef.current = new Audio("/notification.mp3");
  return () => unsubscribeAuth();
}, [router]);

// --- NEW LOGIC (Added after the old logic) ---
useEffect(() => {
  // Wait until the old logic finds the shopId
  if (!merchantShopId) return;

  const q = query(
    collection(db, "orders"),
    where("shopId", "==", merchantShopId),
    orderBy("createdAt", "desc")
  );

  const unsubscribeOrders = onSnapshot(q, (snapshot) => {
    const ordersList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Check if your state variable is named 'setOrders'
    if (typeof setOrders === 'function') {
        setOrders(ordersList);
    }

    // Play sound logic
    if (!snapshot.metadata.hasPendingWrites && snapshot.docChanges().some(c => c.type === 'added')) {
      audioRef.current?.play().catch(() => {});
    }
  });

  return () => unsubscribeOrders();
}, [merchantShopId]);
  
  // STEP 2: DATA LISTENERS (Only runs if merchantShopId is found)
  useEffect(() => {
    if (!merchantShopId) return;

    console.log("Starting listeners for shopId:", merchantShopId);

    // Listen for Orders
    const qOrders = query(
      collection(db, "orders"), 
      where("shopId", "==", merchantShopId),
      where("status", "in", ["AWAITING_PAYMENT", "PAID"]) 
    );
    
    const unsubscribeOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    // Listen for Shop Status
    const unsubShop = onSnapshot(fireDoc(db, "shops", merchantShopId), (snap) => {
      if (snap.exists()) setShopStatus(snap.data().isOpen);
    });

    // Listen for Menu
    const qMenu = query(collection(db, "menu"), where("shopId", "==", merchantShopId));
    const unsubMenu = onSnapshot(qMenu, (snap) => {
      setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeOrders();
      unsubShop();
      unsubMenu();
    };
  }, [merchantShopId]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/merchant/login');
  };

  const handlePaymentStatus = async (id, newStatus) => {
    try {
      await fireUpdateDoc(fireDoc(db, "orders", id), { status: newStatus });
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const toggleShop = async () => {
    if (!merchantShopId) return;
    await fireUpdateDoc(fireDoc(db, "shops", merchantShopId), { isOpen: !shopStatus });
  };

  const toggleItem = async (itemId, currentStatus) => {
    await fireUpdateDoc(fireDoc(db, "menu", itemId), { isAva: !currentStatus });
  };

  if (loading) return <p className="p-10 text-center text-gray-500 font-bold">Verifying Session...</p>;
  
  if (!merchantShopId) return (
    <div className="p-10 text-center">
      <p className="text-red-500 font-bold text-xl">Access Denied</p>
      <p className="text-gray-500 mt-2">Your account is not linked to a shop in Firestore.</p>
      <button onClick={handleLogout} className="mt-4 text-orange-600 underline font-bold">Try Another Login</button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen pb-20 font-sans">
      {/* Header */}
      <div className="bg-white p-6 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tighter">Store Dashboard</h1>
            <p className="text-[10px] text-orange-500 font-bold uppercase">{merchantShopId}</p>
          </div>
          <button onClick={handleLogout} className="text-[10px] font-black text-red-500 uppercase border border-red-100 px-2 py-1 rounded-lg">Logout</button>
        </div>
        
        <div className="flex gap-4 mt-4 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('orders')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${activeTab === 'orders' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>
            Orders ({orders.length})
          </button>
          <button onClick={() => setActiveTab('manage')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${activeTab === 'manage' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>
            Manage Menu
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-gray-400 text-center mt-10 italic">Waiting for new orders...</p>
            ) : (
              orders.map(o => (
                <div key={o.id} className="bg-white p-5 rounded-2xl shadow-md border-l-8 border-orange-500">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-black text-xl text-gray-800">#{o.orderId}</p>
                    <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-1 rounded font-bold uppercase">{o.status}</span>
                  </div>
                  <p className="text-gray-600 font-bold text-sm mb-4">Total: ₹{o.total}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handlePaymentStatus(o.id, "CONFIRMED")} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">Accept</button>
                    <button onClick={() => handlePaymentStatus(o.id, "REJECTED")} className="px-4 bg-red-50 text-red-600 py-3 rounded-xl font-bold">Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border-2 ${shopStatus ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`font-black text-lg ${shopStatus ? 'text-green-800' : 'text-red-800'}`}>
                  Shop: {shopStatus ? 'OPEN' : 'CLOSED'}
                </h3>
                <button onClick={toggleShop} className="bg-white px-4 py-2 rounded-full font-black text-xs shadow-sm">TOGGLE</button>
              </div>
            </div>

            <div className="space-y-3">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm">
                  <p className={`font-bold ${!item.isAva && 'text-gray-400 line-through'}`}>{item.itemName}</p>
                  <button onClick={() => toggleItem(item.id, item.isAva)} className={`px-3 py-2 rounded-xl text-[10px] font-bold border ${item.isAva ? 'text-green-600 border-green-200' : 'text-gray-400 border-gray-100'}`}>
                    {item.isAva ? 'AVAILABLE' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}