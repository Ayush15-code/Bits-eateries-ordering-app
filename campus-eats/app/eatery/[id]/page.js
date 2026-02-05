"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const MOCK_MENU = [
  { id: 1, name: "Cheese Pizza", price: 150 },
  { id: 2, name: "Veg Burger", price: 80 },
  { id: 3, name: "Cold Coffee", price: 60 }
];

export default function Menu() {
  const [cart, setCart] = useState([]);
  const router = useRouter(); // For the back button
  const { id } = useParams(); // For the eatery ID (e.g., 'red-chillies')
  const [order, setOrder] = useState(null);

  useEffect(() => {
    // Your logic to fetch order status using the 'id'
  }, [id]);
  // const total = cart.reduce((sum, item) => sum + item.price, 0);
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
      <h1 className="text-2xl font-bold mb-6 capitalize">{id?.replace('-', ' ')} Menu</h1>

      {MOCK_MENU.map(item => (
        <div key={item.id} className="group mb-4 flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md active:scale-95">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-orange-600 font-bold">₹{item.price}</span>
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full italic">Popular</span>
            </div>
          </div>

          <button
            onClick={() => setCart([...cart, item])}
            className="bg-orange-500 hover:bg-orange-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-orange-200 transition-colors"
          >
            <span className="text-xl font-bold">+</span>
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