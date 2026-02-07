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
  
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (!id) return;
    const savedFavs = JSON.parse(localStorage.getItem('fav_items') || '[]');
    setFavorites(savedFavs);

    const q = query(collection(db, "menu"), where("shopId", "==", id), where("isAva", "==", true));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMenuItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [id]);

  // --- SEARCH & FILTER LOGIC ---
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => 
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuItems, searchQuery]);

  // Group filtered items by Category
  const groupedItems = useMemo(() => {
    return filteredMenuItems.reduce((acc, item) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [filteredMenuItems]);

  const favoriteItems = filteredMenuItems.filter(item => favorites.includes(item.id));

  // If searching, keep all categories open to show results
  useEffect(() => {
    if (searchQuery.length > 0) {
      const allOpen = Object.keys(groupedItems).reduce((acc, cat) => ({ ...acc, [cat]: true }), { Favorites: true });
      setOpenCategories(allOpen);
    }
  }, [searchQuery, groupedItems]);

  const toggleFavorite = (itemId) => {
    const updatedFavs = favorites.includes(itemId) 
      ? favorites.filter(id => id !== itemId) 
      : [...favorites, itemId];
    setFavorites(updatedFavs);
    localStorage.setItem('fav_items', JSON.stringify(updatedFavs));
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-950 min-h-screen pb-32 transition-colors">
      <header className="mb-4">
        <button onClick={() => router.back()} className="mb-4 text-orange-600 font-bold flex items-center gap-1">
          <span>←</span> Back
        </button>
        <h1 className="text-3xl font-black capitalize dark:text-white mb-4">{id?.replace('-', ' ')}</h1>
        
        {/* --- SEARCH BAR --- */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search for 'Cold Coffee'..."
            className="w-full pl-12 pr-10 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-white transition-all shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      

      <div className="space-y-4">
        {/* FAVORITES */}
        {favoriteItems.length > 0 && (
          <CategorySection 
            title="Your Favorites" 
            items={favoriteItems} 
            isOpen={openCategories['Favorites']} 
            onToggle={() => setOpenCategories(p => ({...p, Favorites: !p.Favorites}))}
            favorites={favorites}
            onToggleFav={toggleFavorite}
            onAdd={(item) => setCart([...cart, { ...item, name: item.itemName }])}
            isFavSection
          />
        )}

        {/* ALL CATEGORIES */}
        {Object.keys(groupedItems).map(cat => (
          <CategorySection 
            key={cat}
            title={cat} 
            items={groupedItems[cat]} 
            isOpen={openCategories[cat]} 
            onToggle={() => setOpenCategories(p => ({...p, [cat]: !p[cat]}))}
            favorites={favorites}
            onToggleFav={toggleFavorite}
            onAdd={(item) => setCart([...cart, { ...item, name: item.itemName }])}
          />
        ))}

        {filteredMenuItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 italic">No items match your search.</p>
          </div>
        )}
      </div>

      {/* STICKY CHECKOUT (Hidden when search input is empty + cart empty) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t dark:border-gray-800 max-w-md mx-auto z-50 animate-in slide-in-from-bottom-10">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-gray-500">{cart.length} items</span>
            <span className="text-xl font-black text-gray-800 dark:text-white">₹{total}</span>
          </div>
          <button onClick={() => router.push('/checkout')} className="w-full bg-orange-600 text-white p-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all">
            Review Order
          </button>
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
        <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="space-y-3 pb-4">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-transparent hover:border-orange-100 dark:hover:border-orange-900/30 transition-all">
              <div className="flex items-center gap-4">
                <button onClick={() => onToggleFav(item.id)} className="transition-transform active:scale-150">
                  <Heart size={20} className={favorites.includes(item.id) ? "text-red-500 fill-red-500" : "text-gray-300"} />
                </button>
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100">{item.itemName}</p>
                  <p className="text-orange-600 font-black text-sm">₹{item.price}</p>
                </div>
              </div>
              <button onClick={() => onAdd(item)} className="bg-white dark:bg-gray-800 text-orange-600 border border-orange-100 dark:border-gray-700 w-12 h-10 rounded-2xl flex items-center justify-center font-bold shadow-sm active:scale-90 transition-all">
                +
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}