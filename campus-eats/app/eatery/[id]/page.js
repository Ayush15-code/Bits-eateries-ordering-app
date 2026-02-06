"use client";
import { useState, useEffect } from 'react'; // Added useEffect
import { useRouter, useParams } from 'next/navigation';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Menu() {
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]); // State for Firebase Menu
  const router = useRouter();
  const { id } = useParams(); // This is the shopId from the URL

  // Fetch Menu from Firebase for this specific shop
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, "menu"), 
      where("shopId", "==", id), // Filters by the shop you clicked
      where("isAva", "==", true) // Only shows available items
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(items);
    });

    return () => unsubscribe();
  }, [id]);

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const goToCheckout = () => {
    if (cart.length === 0) return;
    localStorage.setItem('pending_cart', JSON.stringify(cart));
    localStorage.setItem('pending_total', total.toString());
    localStorage.setItem('pending_shop_id', id);
    router.push('/checkout');
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white min-h-screen pb-32">
      <button onClick={() => router.back()} className="mb-4 text-orange-600 font-bold">← Back</button>
      <h1 className="text-2xl font-black mb-6 capitalize">{id?.replace('-', ' ')} Menu</h1>

      <div className="space-y-4">
        {menuItems.length === 0 ? (
          <p className="text-center text-gray-400 py-20 italic">No items available at this shop.</p>
        ) : (
          menuItems.map(item => (
            <div key={item.id} className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md active:scale-95">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{item.itemName}</h3>
                <span className="text-orange-600 font-bold">₹{item.price}</span>
              </div>
              <button
                onClick={() => setCart([...cart, { ...item, name: item.itemName }])} // Mapping itemName to name for cart
                className="bg-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
              >
                <span className="text-xl font-bold">+</span>
              </button>
            </div>
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t max-w-md mx-auto z-50">
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="text-sm font-bold text-gray-400">{cart.length} items added</span>
            <span className="text-xl font-black text-gray-800">₹{total}</span>
          </div>
          <button onClick={goToCheckout} className="w-full bg-orange-600 text-white p-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">
            Confirm Order
          </button>
        </div>
      )}
    </div>
  );
}