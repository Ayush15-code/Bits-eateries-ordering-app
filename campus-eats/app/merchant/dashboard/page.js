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
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);
  
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
// STEP 2: DATA LISTENERS (Consolidated and Updated)
  useEffect(() => {
    if (!merchantShopId) return;

    console.log("Starting listeners for shopId:", merchantShopId);

    // 1. Listen for ALL Orders (Including History)
    const qOrders = query(
      collection(db, "orders"), 
      where("shopId", "==", merchantShopId),
      // We MUST include COLLECTED and REJECTED here for history tab to work
      where("status", "in", ["AWAITING_PAYMENT", "PAID", "CONFIRMED", "ACCEPTED", "COLLECTED", "REJECTED"])
    );
    
    const unsubscribeOrders = onSnapshot(qOrders, (snap) => {
      // Notification Sound Logic
      if (!snap.metadata.hasPendingWrites && snap.docChanges().some(c => c.type === 'added')) {
        audioRef.current?.play().catch(() => {});
      }

      // Manual sort by newest first (No Firestore Index needed)
      const sortedOrders = snap.docs
        .map(d => ({ ...d.data(), id: d.id }))
        .sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        
      setOrders(sortedOrders);
    });

    // 2. Listen for Shop Status
    const unsubShop = onSnapshot(fireDoc(db, "shops", merchantShopId), (snap) => {
      if (snap.exists()) setShopStatus(snap.data().isOpen);
    });

    // 3. Listen for Menu
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
  
  // STEP 2: DATA LISTENERS (Only runs if merchantShopId is found)
  // STEP 2: CONSOLIDATED ORDER LISTENER (Replace ALL order useEffects with this)
useEffect(() => {
  if (!merchantShopId) return;

  console.log("Listening for ALL orders for shop:", merchantShopId);

  // This query MUST include every status to track them from Active -> History
  const qOrders = query(
    collection(db, "orders"), 
    where("shopId", "==", merchantShopId),
    where("status", "in", ["AWAITING_PAYMENT", "PAID", "CONFIRMED", "ACCEPTED", "COLLECTED", "REJECTED"])
  );
  
  const unsubscribeOrders = onSnapshot(qOrders, (snap) => {
    // Sound logic: only for NEW orders added
    if (!snap.metadata.hasPendingWrites && snap.docChanges().some(c => c.type === 'added')) {
      audioRef.current?.play().catch(() => {});
    }

    // Map and Sort (Newest at Top)
    const allOrders = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    const sorted = allOrders.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    console.log("Syncing", sorted.length, "total orders");
    setOrders(sorted);
  });

  return () => unsubscribeOrders();
}, [merchantShopId]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/merchant/login');
  };
  
  const handleClearHistory = async () => {
  const confirmClear = window.confirm("Are you sure you want to clear your history? This will remove all completed orders from this view.");
  
  if (confirmClear) {
    try {
      // Filter for orders that are currently in History
      const historyOrders = orders.filter(o => ['COLLECTED', 'REJECTED'].includes(o.status));
      
      const updatePromises = historyOrders.map(order => {
        return fireUpdateDoc(fireDoc(db, "orders", order.id), {
          status: "ARCHIVED" // We change status so the History filter hides them
        });
      });

      await Promise.all(updatePromises);
      alert("History cleared successfully!");
    } catch (err) {
      console.error("Error clearing history:", err);
      alert("Failed to clear history.");
    }
  }
};

  const handlePaymentStatus = async (id, newStatus) => {
  try {
    const updateData = { status: newStatus };
    
    // Add specific timestamps based on the action
    if (newStatus === "CONFIRMED") {
      updateData.confirmedAt = new Date().toISOString();
    } else if (newStatus === "COLLECTED") {
      updateData.collectedAt = new Date().toISOString();
    }

    await fireUpdateDoc(fireDoc(db, "orders", id), updateData);
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
    {/* Header - Fixed & Cleaned Up */}
    <div className="bg-white p-6 shadow-sm sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tighter">Store Dashboard</h1>
          <p className="text-[10px] text-orange-500 font-bold uppercase">{merchantShopId}</p>
        </div>
        <button onClick={handleLogout} className="text-[10px] font-black text-red-500 uppercase border border-red-100 px-2 py-1 rounded-lg">Logout</button>
      </div>
      
      {/* Tab Navigation - Added History Tab */}
      <div className="flex gap-2 mt-4 bg-gray-100 p-1 rounded-xl">
        <button onClick={() => setActiveTab('orders')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${activeTab === 'orders' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>
          Active ({orders.filter(o => !['COLLECTED', 'REJECTED'].includes(o.status)).length})
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${activeTab === 'history' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>
          History
        </button>
        <button onClick={() => setActiveTab('manage')} className={`flex-1 py-2 rounded-lg font-bold text-xs ${activeTab === 'manage' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>
          Menu
        </button>
      </div>
    </div>

    <div className="p-6">
      {/* 1. ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.filter(o => !['COLLECTED', 'REJECTED'].includes(o.status)).length === 0 ? (
            <p className="text-gray-900 text-center mt-10 italic">Waiting for new orders...</p>
          ) : (
            orders.filter(o => !['COLLECTED', 'REJECTED'].includes(o.status)).map(o => {
              const isRunning = o.status === "CONFIRMED" || o.status === "ACCEPTED";
              return (
                <div key={o.id} className={`bg-white p-5 rounded-2xl shadow-md border-l-8 transition-all ${isRunning ? 'border-green-500' : 'border-orange-500'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-black text-xl text-gray-800">#{o.orderId}</p>
                      <p className="text-[10px] text-gray-900 font-mono">{o.id.slice(-6)}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${isRunning ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {isRunning ? "Running Order" : o.status}
                    </span>
                  </div>
                  <div className="mb-4 text-xs text-gray-600 font-medium">
                    {o.items?.map((item, i) => ( <p key={i}>• {item.name || item.itemName}</p> ))}
                  </div>
                  <p className="text-gray-800 font-black text-sm mb-4">Total: ₹{o.total}</p>
                  <div className="flex gap-2">
                    {!isRunning ? (
                      <>
                        <button onClick={() => handlePaymentStatus(o.id, "CONFIRMED")} className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold">Accept</button>
                        <button onClick={() => handlePaymentStatus(o.id, "REJECTED")} className="px-4 bg-red-50 text-red-600 py-3 rounded-xl font-bold">Reject</button>
                      </>
                    ) : (
                      <button onClick={() => handlePaymentStatus(o.id, "COLLECTED")} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">✅ Mark Collected</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. HISTORY TAB - NEW CONTENT */}
      {activeTab === 'history' && (
  <div className="space-y-4">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-black text-gray-800" style={{ color: '#000000' }}>Completed Orders</h2>
      
      {/* Only show button if there is history to clear */}
      {orders.filter(o => ['COLLECTED', 'REJECTED'].includes(o.status)).length > 0 && (
        <button 
          onClick={handleClearHistory}
          className="text-[10px] font-black text-red-500 uppercase bg-red-50 px-3 py-2 rounded-xl border border-red-100"
        >
          Clear All
        </button>
      )}
    </div>

    {orders.filter(o => ['COLLECTED', 'REJECTED'].includes(o.status)).length === 0 ? (
      <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-200">
        <p className="text-gray-400 italic text-sm">No completed orders yet.</p>
      </div>
    ) : (
      orders.filter(o => ['COLLECTED', 'REJECTED'].includes(o.status)).map(o => (
        <div key={o.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="font-bold text-gray-800" style={{ color: '#000000' }}>Order #{o.orderId}</p>
            <p className={`text-[10px] font-bold ${o.status === 'COLLECTED' ? 'text-green-500' : 'text-red-500'}`}>
              {o.status}
            </p>
          </div>
          <button 
            onClick={() => setSelectedHistoryOrder(o)}
            className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl font-bold text-xs"
          >
            Details
          </button>
        </div>
      ))
    )}
  </div>
)}

      {/* 3. MANAGE MENU TAB */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border-2 ${shopStatus ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex justify-between items-center">
              <h3 className={`font-black text-lg ${shopStatus ? 'text-green-800' : 'text-red-800'}`}>Shop: {shopStatus ? 'OPEN' : 'CLOSED'}</h3>
              <button 
  onClick={toggleShop} 
  className="bg-white px-4 py-2 rounded-full font-black text-xs shadow-sm text-gray-900"
>
  TOGGLE
</button>
            </div>
          </div>
          <div className="space-y-3">
            {menuItems.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-gray-50">
  {/* Item Name - Forcing Black even when crossed out */}
  <p 
    className={`font-bold transition-all ${!item.isAva ? 'opacity-40 line-through' : 'opacity-100'}`}
    style={{ color: '#000000' }}
  >
    {item.itemName}
  </p>

  {/* Toggle Button */}
  <button 
    onClick={() => toggleItem(item.id, item.isAva)} 
    className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-colors ${
      item.isAva 
        ? 'bg-green-50 border-green-200 text-green-700' 
        : 'bg-gray-50 border-gray-200 text-gray-900'
    }`}
    style={{ color: item.isAva ? '#15803d' : '#000000' }} // Forced Green vs Forced Black
  >
    {item.isAva ? '● AVAILABLE' : ' UNAVAILABLE'}
  </button>
</div>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* MORE DETAILS MODAL POPUP */}
    {/* MORE DETAILS MODAL POPUP */}
{selectedHistoryOrder && (
  <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-0 backdrop-blur-sm">
    <div className="bg-white w-full max-w-md rounded-t-[40px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-8" />
      
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black" style={{ color: '#111827' }}>Order Timeline</h3>
        <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-black uppercase">
           #{selectedHistoryOrder.orderId}
        </span>
      </div>
      
      <div className="space-y-8 relative before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
        
        {/* 1. ORDERED AT */}
        <div className="flex gap-6 relative z-10">
          <div className="w-[12px] h-[12px] bg-orange-500 rounded-full ring-4 ring-orange-100 mt-1" />
          <div className="flex-1 border-b border-gray-50 pb-4">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#ea580c' }}>Step 1: Order Received</p>
            <p className="text-xl font-bold leading-none" style={{ color: '#111827' }}>
              {selectedHistoryOrder.createdAt ? new Date(selectedHistoryOrder.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'N/A'}
            </p>
          </div>
        </div>

        {/* 2. CONFIRMED AT */}
        <div className="flex gap-6 relative z-10">
          <div className={`w-[12px] h-[12px] rounded-full mt-1 ${selectedHistoryOrder.confirmedAt ? 'bg-green-500 ring-4 ring-green-100' : 'bg-gray-200'}`} />
          <div className="flex-1 border-b border-gray-50 pb-4">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#6b7280' }}>Step 2: Merchant Accepted</p>
            <p className="text-xl font-bold leading-none" style={{ color: selectedHistoryOrder.confirmedAt ? '#111827' : '#d1d5db' }}>
              {selectedHistoryOrder.confirmedAt ? new Date(selectedHistoryOrder.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '---'}
            </p>
          </div>
        </div>

        {/* 3. COLLECTED AT */}
        <div className="flex gap-6 relative z-10">
          <div className={`w-[12px] h-[12px] rounded-full mt-1 ${selectedHistoryOrder.collectedAt ? 'bg-blue-500 ring-4 ring-blue-100' : 'bg-gray-200'}`} />
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#6b7280' }}>Step 3: Handed Over</p>
            <p className="text-xl font-bold leading-none" style={{ color: selectedHistoryOrder.collectedAt ? '#111827' : '#d1d5db' }}>
              {selectedHistoryOrder.collectedAt ? new Date(selectedHistoryOrder.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '---'}
            </p>
          </div>
        </div>

      </div>

      <button 
        onClick={() => setSelectedHistoryOrder(null)} 
        className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold mt-10 active:scale-95 transition-all shadow-xl"
      >
        Close Details
      </button>
    </div>
  </div>
)}
  </div>
);
}