"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Change line 5 to this:
import { db } from '../lib/firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('pending_cart') || '[]');
    const savedTotal = localStorage.getItem('pending_total') || '0';
    setCart(savedCart);
    setTotal(savedTotal);
  }, []);

  const handleFinalPayment = async () => {
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        items: cart,
        total: total,
        status: "PAID",
        createdAt: serverTimestamp()
      });
      localStorage.removeItem('pending_cart');
      router.push(`/status/${docRef.id}`);
    } catch (e) {
      alert("Payment Error: Make sure your Firebase is connected!");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Review Items</h1>
      
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        {cart.map((item, index) => (
          <div key={index} className="flex justify-between py-2 border-b last:border-0">
            <span>{item.name}</span>
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
        className="w-full bg-green-600 text-white p-4 rounded-2xl font-bold shadow-lg"
      >
        Make Full Payment
      </button>
    </div>
  );
}