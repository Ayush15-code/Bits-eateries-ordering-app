'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  const router = useRouter();

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('pending_cart') || '[]');
    const savedTotal = localStorage.getItem('pending_total') || '0';
    const savedShopId = localStorage.getItem('pending_shop_id') || '';
    setCart(savedCart);
    setTotal(savedTotal);
    setShopId(savedShopId);
  }, []);

  const handleFinalPayment = async () => {
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
        transaction.set(counterRef, { currentCount: nextId, lastDate: todayStr });

        const newOrderRef = doc(ordersCol);
        const orderPayload = {
          orderId: nextId,
          items: cart,
          total: total,
          status: "AWAITING_PAYMENT",
          createdAt: serverTimestamp(),
          dateStr: todayStr,
          shopId: shopId
        };
        transaction.set(newOrderRef, orderPayload);
        return { docId: newOrderRef.id, numericId: nextId };
      });

      const history = JSON.parse(localStorage.getItem('order_history') || '[]');
      history.unshift(newOrderData.docId);
      localStorage.setItem('order_history', JSON.stringify(history));
      localStorage.setItem('last_order_doc_id', newOrderData.docId);

      // UPI Link with dynamic amount
      const upiLink = `upi://pay?pa=your-upi-id@okicici&pn=CampusEats&am=${total}&cu=INR&tn=Order-${newOrderData.numericId}`;
      window.location.href = upiLink;
      router.push(`/status/${newOrderData.docId}`);
    } catch (e) {
      console.error("Order process failed:", e);
      alert("Error creating order.");
    }
  };

  return (
    /* 1. Container: bg-gray-50 -> dark:bg-gray-950 */
    <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
      <button onClick={() => router.back()} className="mb-4 text-orange-600 font-bold">← Edit Order</button>
      
      {/* 2. Heading: Added dark:text-white */}
      <h1 className="text-2xl font-black mb-6 dark:text-white">Review Items</h1>
      
      {/* 3. Review Card: bg-white -> dark:bg-gray-900 and border-b colors */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm mb-6 border border-gray-100 dark:border-gray-800">
        {cart.map((item, index) => (
          <div key={index} className="flex justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
            <span className="font-bold dark:text-white">₹{item.price}</span>
          </div>
        ))}

        {/* 4. Total Row: Added dark:text-white */}
        <div className="flex justify-between mt-4 text-xl font-black border-t border-gray-100 dark:border-gray-800 pt-4">
          <span className="dark:text-white">Total Amount</span>
          <span className="text-orange-600 dark:text-orange-500">₹{total}</span>
        </div>
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl mb-8 border border-orange-100 dark:border-orange-800/30">
        <p className="text-xs text-orange-800 dark:text-orange-300 font-bold text-center">
          Payment is verified manually. Stay on the status page after paying.
        </p>
      </div>

      <button 
        onClick={handleFinalPayment}
        className="w-full bg-green-600 dark:bg-green-500 text-white p-5 rounded-2xl font-black shadow-lg transition-transform active:scale-95 text-lg"
      >
        Pay Now via UPI
      </button>
    </div>
  );
}