"use client";
import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { Clock, Package, ArrowRight } from 'lucide-react';

export default function ActiveOrderPopup() {
  const [activeOrder, setActiveOrder] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  // 1. Prevent rendering on merchant-side pages
  if (pathname.startsWith('/merchant')) return null;

  useEffect(() => {
    let unsub = null;

    const initListener = () => {
      // Get history array
      const history = JSON.parse(localStorage.getItem('order_history') || '[]');
      
      // Get the last item (newest order is usually at index 0 because we used [newEntry, ...history])
      // Change to history[0] because we are now prepending newest orders
      const lastOrderData = history[0]; 

      if (!lastOrderData) {
        setActiveOrder(null);
        return;
      }

      // FIX: Extract only the string ID if lastOrderData is an object
      const lastOrderId = typeof lastOrderData === 'object' ? lastOrderData.id : lastOrderData;

      if (!lastOrderId || typeof lastOrderId !== 'string') {
        setActiveOrder(null);
        return;
      }

      // Listen for updates on the student's active order
      // Using the cleaned string ID here
      unsub = onSnapshot(doc(db, "orders", lastOrderId), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          // Hide if the merchant has finished the cycle
          if (['COLLECTED', 'REJECTED', 'ARCHIVED'].includes(data.status)) {
            setActiveOrder(null);
          } else {
            setActiveOrder({ ...data, id: snap.id });
          }
        }
      }, (error) => {
        console.error("Popup Listener Error:", error);
        setActiveOrder(null);
      });
    };

    initListener();

    return () => {
      if (unsub) unsub();
    };
  }, [pathname]);

  if (!activeOrder) return null;

  // 2. Extracted config function
  const getStatusConfig = (status) => {
    switch (status) {
      case 'AWAITING_VERIFICATION': 
        return { label: 'Verifying Payment', icon: <Clock size={16}/>, color: 'bg-blue-600' };
      case 'CONFIRMED': 
      case 'ACCEPTED':
        return { label: 'Cooking Now', icon: <Package size={16}/>, color: 'bg-orange-600' };
      default: 
        return { label: 'Order Active', icon: <Clock size={16}/>, color: 'bg-gray-600' };
    }
  };

  const config = getStatusConfig(activeOrder.status);

  return (
    <div 
      onClick={() => router.push(`/status/${activeOrder.id}`)}
      className="fixed bottom-6 left-6 right-6 max-w-md mx-auto z-[100] animate-in slide-in-from-bottom duration-500 cursor-pointer"
    >
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4 active:scale-95 transition-all">
        <div className={`p-3 rounded-2xl text-white ${config.color} shadow-lg shadow-blue-600/20`}>
          {config.icon}
        </div>
        
        <div className="flex-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Current Order Status</p>
          <p className="text-sm font-black dark:text-white uppercase tracking-tight">
            {config.label} <span className="text-gray-400 font-medium ml-1">#{activeOrder.orderId}</span>
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-full">
          <ArrowRight size={18} className="text-orange-600" />
        </div>
      </div>
    </div>
  );
}