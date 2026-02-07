'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  runTransaction, 
  serverTimestamp 
} from 'firebase/firestore';

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [shopId, setShopId] = useState('');
  const [isHydrated, setIsHydrated] = useState(false); // NEW: Safety check
  const router = useRouter();

  // 1. Initial Load: Read from storage ONLY ONCE on mount
  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem('pending_cart') || '[]');
      const savedShopId = localStorage.getItem('pending_shop_id') || '';
      
      setCart(savedCart);
      setShopId(savedShopId);
      
      // Mark as finished loading
      setIsHydrated(true); 
    } catch (err) {
      console.error("Failed to load cart:", err);
      setIsHydrated(true); // Still set to true so UI doesn't hang
    }
  }, []);

  // 2. Sync State to LocalStorage: Only runs AFTER hydration
  useEffect(() => {
    if (!isHydrated) return; // STOP: Don't let initial empty state overwrite storage

    const newTotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    setTotal(newTotal);
    
    if (cart.length > 0) {
      localStorage.setItem('pending_cart', JSON.stringify(cart));
      localStorage.setItem('pending_total', newTotal.toString());
      localStorage.setItem('pending_shop_id', shopId);
    } else {
      // If user removes everything manually on this screen
      localStorage.removeItem('pending_cart');
      localStorage.removeItem('pending_total');
      localStorage.removeItem('pending_shop_id');
    }
  }, [cart, isHydrated, shopId]);

  // 3. Grouping Logic for UI Display
  const groupedItems = cart.reduce((acc, item) => {
    const itemId = item.id || item.itemName || item.name || 'temp-id';
    const existing = acc.find(i => (i.id || i.itemName || i.name) === itemId);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      acc.push({ 
        ...item, 
        id: itemId, 
        displayName: item.itemName || item.name || "Item", 
        quantity: 1 
      });
    }
    return acc;
  }, []);

  // 4. Quantity Handlers
  const addItem = (item) => {
    const { quantity, displayName, ...originalItem } = item;
    setCart(prev => [...prev, originalItem]);
  };

  const removeItem = (targetId) => {
    const index = cart.findIndex(item => (item.id || item.itemName || item.name) === targetId);
    if (index > -1) {
      const newCart = [...cart];
      newCart.splice(index, 1);
      setCart(newCart);
    }
  };
  
  // 5. Final Payment: Handle Cleanup here
  const handleFinalPayment = async () => {
    if (cart.length === 0) return;

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const counterRef = doc(db, "internal", "order_counter");
      const ordersCol = collection(db, "orders");

      const newOrderData = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        let nextId = 1;
        if (counterSnap.exists()) {
          const data = counterSnap.data();
          if (data.lastDate === todayStr) {
            nextId = data.currentCount + 1;
          }
        }
        transaction.set(counterRef, { currentCount: nextId, lastDate: todayStr }, { merge: true });

        const newOrderRef = doc(ordersCol);
        transaction.set(newOrderRef, {
          orderId: nextId,
          items: cart,
          total: total,
          status: "AWAITING_PAYMENT",
          createdAt: serverTimestamp(),
          dateStr: todayStr,
          shopId: shopId
        });
        return { docId: newOrderRef.id, numericId: nextId };
      });

      // --- CLEANUP START ---
      localStorage.removeItem('pending_cart');
      localStorage.removeItem('pending_total');
      localStorage.removeItem('pending_shop_id');
      
      localStorage.setItem('last_order_doc_id', newOrderData.docId);
      
      setCart([]); // This triggers the final storage wipe
      // --- CLEANUP END ---

      const upiLink = `upi://pay?pa=your-upi-id@okicici&pn=CampusEats&am=${total}&cu=INR&tn=Order-${newOrderData.numericId}`;
      
      setTimeout(() => {
        window.location.href = upiLink;
      }, 150);

      router.push(`/status/${newOrderData.docId}`);
    } catch (e) {
      console.error("Order process failed:", e);
      alert("Error creating order. Please try again.");
    }
  };

  // If we haven't read from localStorage yet, show a clean loading state 
  // to prevent the "Empty Cart" text from flashing
  if (!isHydrated) return null;

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
      <button onClick={() => router.back()} className="mb-4 text-orange-600 font-bold hover:underline">
        ← Edit Order
      </button>
      
      <h1 className="text-2xl font-black mb-6 dark:text-white">Review Items</h1>
      
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm mb-6 border border-gray-100 dark:border-gray-800">
        {groupedItems.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-500 dark:text-gray-400 italic">Your cart is empty</p>
            <button onClick={() => router.back()} className="mt-4 text-orange-600 text-sm font-bold underline">
              Go back to menu
            </button>
          </div>
        ) : (
          groupedItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <div className="flex-1 pr-4">
                <h3 className="text-gray-800 dark:text-gray-100 font-bold leading-tight">{item.displayName}</h3>
                <p className="text-gray-400 text-xs mt-1">₹{item.price} each</p>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-inner">
                <button onClick={() => removeItem(item.id)} className="text-orange-600 font-black text-xl w-6 h-6 flex items-center justify-center transition-colors active:scale-90">−</button>
                <span className="text-gray-800 dark:text-white font-black text-sm w-5 text-center">{item.quantity}</span>
                <button onClick={() => addItem(item)} className="text-green-600 font-black text-xl w-6 h-6 flex items-center justify-center transition-colors active:scale-90">+</button>
              </div>

              <div className="ml-4 w-20 text-right">
                <span className="font-black dark:text-white text-gray-900">₹{item.price * item.quantity}</span>
              </div>
            </div>
          ))
        )}

        <div className="flex justify-between mt-4 text-xl font-black border-t border-gray-100 dark:border-gray-800 pt-6">
          <span className="dark:text-white">Total Amount</span>
          <span className="text-orange-600 dark:text-orange-500">₹{total}</span>
        </div>
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl mb-8 border border-orange-100 dark:border-orange-800/30 text-center">
        <p className="text-[11px] text-orange-800 dark:text-orange-300 font-bold leading-relaxed">
          Payment is verified manually. Stay on the status page after paying.
        </p>
      </div>

      <button 
        onClick={handleFinalPayment} 
        disabled={cart.length === 0}
        className="w-full bg-green-600 dark:bg-green-500 text-white p-5 rounded-3xl font-black shadow-xl transition-all active:scale-95 text-lg disabled:opacity-50 disabled:grayscale mb-4"
      >
        Pay ₹{total} via UPI
      </button>
    </div>
  );
}