"use client";
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
      // 1. Prepare Date and References
      const todayStr = new Date().toISOString().split('T')[0]; // e.g., "2024-05-20"
      const counterRef = doc(db, "internal", "order_counter");
      const ordersCol = collection(db, "orders");

      // 2. Run Transaction to get the next sequential ID
      const newOrderData = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        
        let nextId = 1;

        if (counterSnap.exists()) {
          const data = counterSnap.data();
          // Reset to 1 if the stored date is not today
          if (data.lastDate === todayStr) {
            nextId = data.currentCount + 1;
          }
        }

        // Update/Set the counter for the next person
        transaction.set(counterRef, {
          currentCount: nextId,
          lastDate: todayStr
        });

        // Create the actual order document reference
        const newOrderRef = doc(ordersCol);
        const orderPayload = {
          orderId: nextId, // This will be 1, 2, 3...
          items: cart,
          total: total,
          status: "AWAITING_PAYMENT",
          createdAt: serverTimestamp(),
          dateStr: todayStr,
          shopId: shopId
        };

        // Save the order inside the transaction
        transaction.set(newOrderRef, orderPayload);
        
        return { docId: newOrderRef.id, numericId: nextId };
      });
      const history = JSON.parse(localStorage.getItem('order_history') || '[]');
      history.unshift(newOrderData.docId); // Add new ID to the start of the list
      localStorage.setItem('order_history', JSON.stringify(history));
      localStorage.setItem('last_order_doc_id', newOrderData.docId);

      // 3. Trigger UPI Payment
      const upiLink = `upi://pay?pa=your-upi-id@okicici&pn=CampusEats&am=${total}&cu=INR&tn=Order-${newOrderData.numericId}`;
      window.location.href = upiLink;

      // 4. Redirect to status page
      router.push(`/status/${newOrderData.docId}`);

    } catch (e) {
      console.error("Order process failed:", e);
      alert("Error creating order. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Review Items</h1>
      
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        {cart.map((item, index) => (
          <div key={index} className="flex justify-between py-2 border-b last:border-0">
            <span className="text-gray-700">{item.name}</span>
            <span className="font-bold">₹{item.price}</span>
          </div>
        ))}
        <div className="flex justify-between mt-4 text-xl font-bold border-t pt-4">
          <span>Total</span>
          <span className="text-orange-600">₹{total}</span>
        </div>
      </div>

      <button 
        onClick={handleFinalPayment}
        className="w-full bg-green-600 text-white p-4 rounded-2xl font-bold shadow-lg transition-transform active:scale-95"
      >
        Make Full Payment
      </button>
    </div>
  );
}