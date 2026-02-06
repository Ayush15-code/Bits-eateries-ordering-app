"use client";
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const MOCK_MENU = [
  { id: 1, name: "Mysore Masala Dosa", price: 60 },
  { id: 2, name: "Veg Burger", price: 80 },
  { id: 3, name: "Cold Coffee", price: 60 }
];

export default function Menu() {
  const [cart, setCart] = useState([]);
  const router = useRouter();
  const { id } = useParams();

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  // This replaces your old placeOrder function
  // Ensure this function exists in your Menu component
const goToCheckout = () => {
  if (cart.length === 0) return;
  
  // Save data for the next page
  localStorage.setItem('pending_cart', JSON.stringify(cart));
  localStorage.setItem('pending_total', total.toString());
  
  // Move to the checkout page
  router.push('/checkout');
};

// ... inside your return statement:
<button
  onClick={goToCheckout}
  className="w-full bg-orange-500 text-white p-4 rounded-2xl font-bold shadow-lg"
>
  Pay ₹{total} & Confirm Order
</button>

  return (
    <div className="max-w-md mx-auto p-6 bg-white min-h-screen pb-32">
      <button onClick={() => router.back()} className="mb-4 text-orange-600 font-bold">← Back</button>
      <h1 className="text-2xl font-bold mb-6 capitalize">{id?.replace('-', ' ')} Menu</h1>

      {MOCK_MENU.map(item => (
        <div key={item.id} className="group mb-4 flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md active:scale-95">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
            <span className="text-orange-600 font-bold">₹{item.price}</span>
          </div>

          <button
            onClick={() => setCart([...cart, item])}
            className="bg-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
          >
            <span className="text-xl font-bold">+</span>
          </button>
        </div>
      ))}

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t-2 max-w-md mx-auto">
          <button
            onClick={goToCheckout}
            className="w-full bg-orange-500 text-white p-4 rounded-2xl font-bold shadow-lg"
          >
            Pay ₹{total} & Confirm Order
          </button>
        </div>
      )}
    </div>
  );
}