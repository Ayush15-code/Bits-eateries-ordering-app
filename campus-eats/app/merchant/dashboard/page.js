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
import { Eye, X } from 'lucide-react'; // Added icons for the viewer

export default function MerchantDash() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); 
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);
  const [merchantShopId, setMerchantShopId] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [shopStatus, setShopStatus] = useState(true);
  
  // State for the Base64 Screenshot Viewer
  const [viewingScreenshot, setViewingScreenshot] = useState(null); 

  const router = useRouter();
  const audioRef = useRef(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/merchant/login');
      } else {
        try {
          const userDoc = await fireGetDoc(fireDoc(db, "users", user.uid));
          if (userDoc.exists()) {
            setMerchantShopId(userDoc.data().shopId);
          } else {
            alert("Access Denied: UID not linked to a shopId in 'users' collection.");
          }
        } catch (err) {
          console.error("Auth Error:", err);
        } finally {
          setLoading(false);
        }
      }
    });

    audioRef.current = new Audio("/notification.mp3");
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!merchantShopId) return;

    const qOrders = query(
      collection(db, "orders"), 
      where("shopId", "==", merchantShopId),
      where("status", "in", ["AWAITING_PAYMENT", "AWAITING_VERIFICATION", "CONFIRMED", "ACCEPTED", "COLLECTED", "REJECTED"])
    );
    
    const unsubscribeOrders = onSnapshot(qOrders, (snap) => {
      if (!snap.metadata.hasPendingWrites && snap.docChanges().some(c => c.type === 'added')) {
        audioRef.current?.play().catch(() => {});
      }

      const sortedOrders = snap.docs
        .map(d => ({ ...d.data(), id: d.id }))
        .sort((a, b) => {
            if (a.status === 'AWAITING_VERIFICATION' && b.status !== 'AWAITING_VERIFICATION') return -1;
            if (a.status !== 'AWAITING_VERIFICATION' && b.status === 'AWAITING_VERIFICATION') return 1;
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
        
      setOrders(sortedOrders);
    });

    const unsubShop = onSnapshot(fireDoc(db, "shops", merchantShopId), (snap) => {
      if (snap.exists()) setShopStatus(snap.data().isOpen);
    });

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

  const getGroupedItems = (items) => {
    return (items || []).reduce((acc, item) => {
      const name = item.itemName || item.name || "Item";
      if (acc[name]) acc[name].quantity += 1;
      else acc[name] = { name: name, quantity: 1 };
      return acc;
    }, {});
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/merchant/login');
  };
  
  const handleClearHistory = async () => {
    if (window.confirm("Clear all completed orders?")) {
      try {
        const historyOrders = orders.filter(o => ['COLLECTED', 'REJECTED'].includes(o.status));
        const updatePromises = historyOrders.map(order => 
          fireUpdateDoc(fireDoc(db, "orders", order.id), { status: "ARCHIVED" })
        );
        await Promise.all(updatePromises);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePaymentStatus = async (id, newStatus) => {
    try {
      const updateData = { status: newStatus };
      // Tracking timelines
      if (newStatus === "CONFIRMED" || newStatus === "ACCEPTED") updateData.confirmedAt = new Date().toISOString();
      else if (newStatus === "COLLECTED") updateData.collectedAt = new Date().toISOString();
      await fireUpdateDoc(fireDoc(db, "orders", id), updateData);
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleShop = async () => {
    await fireUpdateDoc(fireDoc(db, "shops", merchantShopId), { isOpen: !shopStatus });
  };

  const toggleItem = async (itemId, currentStatus) => {
    await fireUpdateDoc(fireDoc(db, "menu", itemId), { isAva: !currentStatus });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Verifying Store Session...</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-gray-100 dark:bg-gray-950 min-h-screen pb-20 font-sans transition-colors duration-300">
      
      <div className="bg-white dark:bg-gray-900 p-6 shadow-sm sticky top-0 z-10 border-b dark:border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter uppercase">CampusEats</h1>
            <p className="text-[10px] text-orange-500 font-bold uppercase">{merchantShopId}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={handleLogout} className="text-[10px] font-black text-red-500 uppercase border border-red-100 dark:border-red-900/30 px-2 py-1 rounded-lg">Logout</button>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button onClick={() => setActiveTab('orders')} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'orders' ? 'bg-white dark:bg-gray-700 shadow text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
            Active ({orders.filter(o => !['COLLECTED', 'REJECTED', 'AWAITING_PAYMENT'].includes(o.status)).length})
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-700 shadow text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
            History
          </button>
          <button onClick={() => setActiveTab('manage')} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'manage' ? 'bg-white dark:bg-gray-700 shadow text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
            Menu
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.filter(o => !['COLLECTED', 'REJECTED', 'AWAITING_PAYMENT'].includes(o.status)).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-600 text-center mt-10 italic font-bold text-xs uppercase tracking-widest">Waiting for Orders...</p>
            ) : (
              orders.filter(o => !['COLLECTED', 'REJECTED', 'AWAITING_PAYMENT'].includes(o.status)).map(o => {
                const isVerification = o.status === "AWAITING_VERIFICATION";
                const isRunning = o.status === "CONFIRMED" || o.status === "ACCEPTED";
                const grouped = getGroupedItems(o.items);

                return (
                  <div key={o.id} className={`bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-md border-l-8 transition-all ${
                    isVerification ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/10' : 
                    isRunning ? 'border-green-500' : 'border-orange-500'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-black text-xl text-gray-800 dark:text-white leading-none">#{o.orderId}</p>
                        <p className="text-[10px] text-gray-400 font-mono uppercase">{o.id.slice(-6)}</p>
                      </div>
                      <span className={`text-[9px] px-2 py-1 rounded font-black uppercase ${
                        isVerification ? 'bg-blue-600 text-white' :
                        isRunning ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 
                        'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                      }`}>
                        {isVerification ? "Review Payment" : isRunning ? "Cooking" : "Pending"}
                      </span>
                    </div>

                    {/* Base64 Proof Viewer Button */}
                    {isVerification && o.screenshotBase64 && (
                      <div className="mb-4">
                        <button 
                          onClick={() => setViewingScreenshot(o.screenshotBase64)}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-blue-600/20"
                        >
                          <Eye size={16} /> View Payment Proof
                        </button>
                      </div>
                    )}

                    <div className="mb-4 space-y-1 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                      {Object.values(grouped).map((item, i) => ( 
                        <p key={i} className="text-sm font-bold text-gray-700 dark:text-gray-200">
                          <span className="text-orange-600 mr-2">{item.quantity}x</span> {item.name}
                        </p>
                      ))}
                    </div>

                    <p className="text-gray-800 dark:text-white font-black text-sm mb-4">Total: ₹{o.total}</p>
                    <div className="flex gap-2">
                      {isVerification ? (
                        <>
                          <button onClick={() => handlePaymentStatus(o.id, "CONFIRMED")} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold active:scale-95 transition-all uppercase text-[10px]">Accept Payment</button>
                          <button onClick={() => handlePaymentStatus(o.id, "REJECTED")} className="px-4 bg-red-50 dark:bg-red-900/20 text-red-600 py-3 rounded-xl font-bold active:scale-95 transition-all uppercase text-[10px]">Reject</button>
                        </>
                      ) : !isRunning ? (
                        <>
                          <button onClick={() => handlePaymentStatus(o.id, "CONFIRMED")} className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold active:scale-95 transition-all uppercase text-[10px]">Accept Order</button>
                          <button onClick={() => handlePaymentStatus(o.id, "REJECTED")} className="px-4 bg-red-50 dark:bg-red-900/20 text-red-600 py-3 rounded-xl font-bold active:scale-95 transition-all uppercase text-[10px]">Reject</button>
                        </>
                      ) : (
                        <button onClick={() => handlePaymentStatus(o.id, "COLLECTED")} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold active:scale-95 transition-all uppercase text-[10px]">Mark Collected</button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tighter">Completed Orders</h2>
              {orders.filter(o => ['COLLECTED', 'REJECTED'].includes(o.status)).length > 0 && (
                <button onClick={handleClearHistory} className="text-[10px] font-black text-red-500 uppercase bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl border border-red-100 dark:border-red-900/30 transition-all active:scale-90">Clear History</button>
              )}
            </div>

            {orders.filter(o => ['COLLECTED', 'REJECTED'].includes(o.status)).map(o => (
                <div key={o.id} className="bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center transition-all">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-gray-800 dark:text-white">Order #{o.orderId}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${o.status === 'COLLECTED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>{o.status}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 font-bold tracking-tight">₹{o.total} • {o.items?.length} items</p>
                  </div>
                  <button onClick={() => setSelectedHistoryOrder(o)} className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-4 py-2.5 rounded-2xl font-black text-xs active:scale-95 transition-transform uppercase">Timeline</button>
                </div>
            ))}
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border-2 transition-all ${shopStatus ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 shadow-inner' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 shadow-inner'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`font-black text-lg ${shopStatus ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>Store is {shopStatus ? 'OPEN' : 'CLOSED'}</h3>
                <button onClick={toggleShop} className="bg-white dark:bg-gray-800 px-6 py-2 rounded-full font-black text-xs shadow-md text-gray-900 dark:text-white active:scale-90 transition-all uppercase">Toggle Status</button>
              </div>
            </div>
            <div className="space-y-3">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl flex justify-between items-center shadow-sm border border-gray-50 dark:border-gray-800 transition-all">
                  <p className={`font-bold transition-all ${!item.isAva ? 'opacity-40 line-through' : 'opacity-100'} text-gray-900 dark:text-white`}>{item.itemName}</p>
                  <button onClick={() => toggleItem(item.id, item.isAva)} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-colors ${item.isAva ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                    {item.isAva ? '● AVAILABLE' : 'UNAVAILABLE'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- TIMELINE MODAL --- */}
      {selectedHistoryOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0 backdrop-blur-sm transition-all" onClick={() => setSelectedHistoryOrder(null)}>
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-[40px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-8" />
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter uppercase">Order Timeline</h3>
            <div className="space-y-8 relative before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100 dark:before:bg-gray-800">
              <TimelineStep label="Order Received" time={selectedHistoryOrder.createdAt} active />
              <TimelineStep label="Merchant Confirmed" time={selectedHistoryOrder.confirmedAt} active={!!selectedHistoryOrder.confirmedAt} color="bg-green-500" />
              <TimelineStep label="Delivery Completed" time={selectedHistoryOrder.collectedAt} active={!!selectedHistoryOrder.collectedAt} color="bg-blue-500" />
            </div>
            <button onClick={() => setSelectedHistoryOrder(null)} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black mt-10 active:scale-95 transition-all shadow-xl uppercase">Close Details</button>
          </div>
        </div>
      )}

      {/* --- BASE64 PROOF MODAL --- */}
      {viewingScreenshot && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-md" onClick={() => setViewingScreenshot(null)}>
          <div className="relative max-w-sm w-full bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Payment Verification</p>
              <button onClick={() => setViewingScreenshot(null)} className="text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"><X size={20}/></button>
            </div>
            <div className="p-4 bg-gray-100 dark:bg-black flex justify-center items-center">
              <img src={viewingScreenshot} alt="Proof" className="w-full h-auto rounded-xl shadow-md border dark:border-gray-800 max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineStep({ label, time, active, color = "bg-orange-500" }) {
  const formattedTime = time?.seconds 
    ? new Date(time.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : typeof time === 'string' 
    ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : '---';

  return (
    <div className="flex gap-6 relative z-10">
      <div className={`w-[12px] h-[12px] rounded-full mt-1 ${active ? `${color} ring-4 ${color}/20` : 'bg-gray-200 dark:bg-gray-800'}`} />
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-xl font-bold leading-none ${active ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-700'}`}>{formattedTime}</p>
      </div>
    </div>
  );
}