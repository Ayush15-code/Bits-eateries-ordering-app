"use client";
import { useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
 
const MOCK_MENU = [
  { id: 1, name: "Cheese Pizza", price: 150 },
  { id: 2, name: "Veg Burger", price: 80 },
  { id: 3, name: "Cold Coffee", price: 60 }
];

export default function Menu() {
  const [cart, setCart] = useState([]);
  const router = useRouter();
  const { id } = router.query;

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        items: cart,
        total: total,
        status: "PAID",
        eateryId: id || "store1",
        createdAt: serverTimestamp()
      });
      router.push(`/status/${docRef.id}`);
    } catch (e) { alert("Error placing order"); }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white min-h-screen pb-32">
      <button onClick={() => router.back()} className="mb-4 text-orange-600 font-bold">← Back</button>
      <h1 className="text-2xl font-bold mb-6 capitalize">{id?.replace('-',' ')} Menu</h1>
      
      {MOCK_MENU.map(item => (
        <div key={item.id} className="flex justify-between items-center border-b py-4">
          <div>
            <p className="font-semibold">{item.name}</p>
            <p className="text-orange-600 text-sm">₹{item.price}</p>
          </div>
          <button 
            onClick={() => setCart([...cart, item])}
            className="bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-sm font-bold"
          >
            + Add
          </button>
        </div>
      ))}

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t-2 max-w-md mx-auto">
          <button 
            onClick={placeOrder}
            className="w-full bg-orange-500 text-white p-4 rounded-2xl font-bold shadow-lg"
          >
            Pay ₹{total} & Confirm Order
          </button>
        </div>
      )}
    </div>
  );
}