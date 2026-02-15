'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { ChevronDown, Search, Heart } from 'lucide-react';

export default function Menu() {
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  // General ko default true rakha hai
  const [openCategories, setOpenCategories] = useState({ Favorites: true, General: true });
  const [isHydrated, setIsHydrated] = useState(false);

  const router = useRouter();
  const { id } = useParams(); 

  useEffect(() => {
    if (!id) return;
    
    const savedFavs = JSON.parse(localStorage.getItem('fav_items') || '[]');
    setFavorites(savedFavs);
    const savedCart = JSON.parse(localStorage.getItem('pending_cart') || '[]');
    const savedShopId = localStorage.getItem('pending_shop_id');
    
    if (savedShopId === id) {
      setCart(savedCart);
    }
    setIsHydrated(true);

    // 1. Snapshot Listener (metabase collection)
    const menuRef = doc(db, "metabase", id);
    const unsubscribe = onSnapshot(menuRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        console.log("Raw Data from Firestore:", data); // Check console for this
        const allItems = data.items || [];
        // Filtering based on 'isAvailable' field from your screenshot
        setMenuItems(allItems.filter(item => item.isAvailable === true));
      } else {
        console.log("No document found for ID:", id);
        setMenuItems([]);
      }
    });

    return () => unsubscribe();
  }, [id]);

  // Total Calculation (Using Capital 'P' for Price)
  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.Price) || 0), 0);
  }, [cart]);

  useEffect(() => {
    if (!isHydrated) return;
    if (cart.length > 0) {
      localStorage.setItem('pending_cart', JSON.stringify(cart));
      localStorage.setItem('pending_shop_id', id);
      localStorage.setItem('pending_total', total.toString());
    } else {
      localStorage.removeItem('pending_cart');
      localStorage.removeItem('pending_total');
    }
  }, [cart, isHydrated, id, total]);

  const addToCart = (item) => {
    setCart(prev => [...prev, { ...item }]);
  };

  const toggleFavorite = (itemId) => {
    const updatedFavs = favorites.includes(itemId) 
      ? favorites.filter(fid => fid !== itemId) 
      : [...favorites, itemId];
    setFavorites(updatedFavs);
    localStorage.setItem('fav_items', JSON.stringify(updatedFavs));
  };

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuItems, searchQuery]);

  // FIX: Force everything into 'General' if category is missing
  const groupedItems = useMemo(() => {
    const groups = filteredMenuItems.reduce((acc, item) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
    return groups;
  }, [filteredMenuItems]);

  const favoriteItems = filteredMenuItems.filter(item => favorites.includes(item.id));

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-950 min-h-screen pb-40 transition-colors">
      <header className="mb-4">
        <button onClick={() => router.back()} className="mb-4 text-orange-600 font-bold flex items-center gap-1">← Back</button>
        <h1 className="text-xl font-black truncate dark:text-white mb-4">Menu</h1>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search snacks..."
            className="w-full pl-12 pr-10 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl outline-none text-gray-800 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="space-y-4">
        {Object.keys(groupedItems).length > 0 ? (
          Object.keys(groupedItems).map(cat => (
            <div key={cat} className="border-b border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => setOpenCategories(p => ({...p, [cat]: !p[cat]}))}
                className="w-full flex justify-between items-center py-4"
              >
                <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 uppercase">{cat}</h2>
                <ChevronDown size={20} className={`transition-transform ${openCategories[cat] ? 'rotate-180 text-orange-500' : ''}`} />
              </button>

              {openCategories[cat] && (
                <div className="space-y-3 pb-4">
                  {groupedItems[cat].map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-transparent">
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleFavorite(item.id)}>
                          <Heart size={20} className={favorites.includes(item.id) ? "text-red-500 fill-red-500" : "text-gray-300"} />
                        </button>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-100">{item.name}</p>
                          <p className="text-orange-600 font-black text-sm">₹{item.Price}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => addToCart(item)} 
                        className="bg-white dark:bg-gray-800 text-orange-600 border w-12 h-10 rounded-2xl flex items-center justify-center font-bold active:scale-90 transition-all"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-400 italic">No items available</div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-8 left-0 right-0 px-4 z-50 flex justify-center">
          <div className="w-full max-w-md bg-orange-600 text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between">
            <div className="flex flex-col pl-2">
              <span className="font-black text-sm">{cart.length} Items • ₹{total}</span>
            </div>
            <button onClick={() => router.push('/checkout')} className="bg-white text-orange-600 px-6 py-2.5 rounded-2xl font-black text-xs">
              Checkout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}