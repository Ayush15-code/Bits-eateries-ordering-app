'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ChevronDown, Search, X, Heart } from 'lucide-react';

export default function Menu() {
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState({ Favorites: true });
  const [isHydrated, setIsHydrated] = useState(false);

  const router = useRouter();
  const { id } = useParams();

  // 1. INITIAL LOAD: Load from LocalStorage once on mount
  useEffect(() => {
    if (!id) return;
    
    // Load favorites
    const savedFavs = JSON.parse(localStorage.getItem('fav_items') || '[]');
    setFavorites(savedFavs);

    // Load existing cart if it belongs to this shop
    const savedCart = JSON.parse(localStorage.getItem('pending_cart') || '[]');
    const savedShopId = localStorage.getItem('pending_shop_id');
    
    if (savedShopId === id) {
      setCart(savedCart);
    }
    
    // Crucial: Mark hydration as complete so we can start saving updates
    setIsHydrated(true);

    // Subscribe to Firebase Menu
    const q = query(collection(db, "menu"), where("shopId", "==", id), where("isAva", "==", true));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMenuItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [id]);

  // 2. AUTO-SAVE: Sync cart to LocalStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return; // Prevent overwriting storage with empty [] on load

    if (cart.length > 0) {
      localStorage.setItem('pending_cart', JSON.stringify(cart));
      localStorage.setItem('pending_shop_id', id);
      const newTotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
      localStorage.setItem('pending_total', newTotal.toString());
    } else {
      // If the cart becomes empty, clear specific storage items
      localStorage.removeItem('pending_cart');
      localStorage.removeItem('pending_total');
    }
  }, [cart, isHydrated, id]);

  const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  // --- UPDATED LOGIC ---
  const addToCart = (item) => {
    // 1. Force a direct read from LocalStorage to check for items from other shops
    const savedShopId = localStorage.getItem('pending_shop_id');
    const savedCartJson = localStorage.getItem('pending_cart');
    const savedCart = savedCartJson ? JSON.parse(savedCartJson) : [];
    
    // 2. Check: Is there a shop ID in storage? Is it different from this shop? Does it have items?
    if (savedShopId && savedShopId !== id && savedCart.length > 0) {
      const itemNames = savedCart.map(i => i.name || i.itemName).join(", ");
      const oldShopName = savedShopId.replace('-', ' ');
      const newShopName = id.replace('-', ' ');

      const confirmClear = window.confirm(
        `Your cart already has [${itemNames}] from ${oldShopName}.\n\n` +
        `Do you want to clear these items and start a new order at ${newShopName}?`
      );
      
      if (!confirmClear) return;

      // 3. User confirmed: Wipe old data and start fresh
      localStorage.removeItem('pending_cart');
      localStorage.removeItem('pending_total');
    }

    // 4. Normal Add: This will now either add to current shop or start the fresh cart
    setCart(prev => [...prev, { ...item, name: item.itemName }]);
    // The useEffect in your code will handle saving this new state to LocalStorage
  };

  const toggleFavorite = (itemId) => {
    const updatedFavs = favorites.includes(itemId) 
      ? favorites.filter(id => id !== itemId) 
      : [...favorites, itemId];
    setFavorites(updatedFavs);
    localStorage.setItem('fav_items', JSON.stringify(updatedFavs));
  };

  // Filter & Grouping
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => 
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuItems, searchQuery]);

  const groupedItems = useMemo(() => {
    return filteredMenuItems.reduce((acc, item) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [filteredMenuItems]);

  const favoriteItems = filteredMenuItems.filter(item => favorites.includes(item.id));

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-950 min-h-screen pb-40 transition-colors">
      <header className="mb-4">
        <button onClick={() => router.back()} className="mb-4 text-orange-600 font-bold flex items-center gap-1">
          <span>←</span> Back
        </button>
        <h1 className="text-3xl font-black capitalize dark:text-white mb-4">{id?.replace('-', ' ')}</h1>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search menu..."
            className="w-full pl-12 pr-10 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="space-y-4">
        {favoriteItems.length > 0 && (
          <CategorySection 
            title="Your Favorites" 
            items={favoriteItems} 
            isOpen={openCategories['Favorites']} 
            onToggle={() => setOpenCategories(p => ({...p, Favorites: !p.Favorites}))}
            favorites={favorites}
            onToggleFav={toggleFavorite}
            onAdd={addToCart}
            isFavSection
          />
        )}

        {Object.keys(groupedItems).map(cat => (
          <CategorySection 
            key={cat}
            title={cat} 
            items={groupedItems[cat]} 
            isOpen={openCategories[cat]} 
            onToggle={() => setOpenCategories(p => ({...p, [cat]: !p[cat]}))}
            favorites={favorites}
            onToggleFav={toggleFavorite}
            onAdd={addToCart}
          />
        ))}

        {filteredMenuItems.length === 0 && (
           <div className="text-center py-20 text-gray-400 italic">No items found</div>
        )}
      </div>

      {/* --- LIVE CART COMPONENT --- */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-0 right-0 px-4 z-50 flex justify-center">
          <div className="w-full max-w-md bg-orange-600 text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-8">
            <div className="flex flex-col pl-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Live Cart</span>
              <span className="font-black text-sm">{cart.length} Items • ₹{total}</span>
            </div>
            
            <button 
              onClick={() => router.push('/checkout')}
              className="bg-white text-orange-600 px-6 py-2.5 rounded-2xl font-black text-xs shadow-sm active:scale-95 transition-all"
            >
              View Checkout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategorySection({ title, items, isOpen, onToggle, favorites, onToggleFav, onAdd, isFavSection }) {
  return (
    <div className="border-b border-gray-100 dark:border-gray-800">
      <button onClick={onToggle} className="w-full flex justify-between items-center py-4">
        <h2 className={`text-lg font-black flex items-center gap-2 ${isFavSection ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'}`}>
          {isFavSection && <Heart size={18} fill="currentColor" />}
          {title} <span className="text-xs text-gray-400 font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{items.length}</span>
        </h2>
        <ChevronDown size={20} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="space-y-3 pb-4">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-transparent hover:border-orange-100 transition-all">
              <div className="flex items-center gap-4">
                <button onClick={() => onToggleFav(item.id)}>
                  <Heart size={20} className={favorites.includes(item.id) ? "text-red-500 fill-red-500" : "text-gray-300"} />
                </button>
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100">{item.itemName}</p>
                  <p className="text-orange-600 font-black text-sm">₹{item.price}</p>
                </div>
              </div>
              <button 
                onClick={() => onAdd(item)} 
                className="bg-white dark:bg-gray-800 text-orange-600 border border-orange-100 dark:border-gray-700 w-12 h-10 rounded-2xl flex items-center justify-center font-bold shadow-sm active:scale-90 transition-all"
              >
                +
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}