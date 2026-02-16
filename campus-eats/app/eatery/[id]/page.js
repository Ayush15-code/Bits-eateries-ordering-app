'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore'; 
import { ChevronDown, Search, Heart } from 'lucide-react';

export default function Menu() {
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState({ Favorites: true, General: true });
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { id } = useParams(); // This is the Shop ID (e.g., 'AH9')

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

    const fetchMenuData = async () => {
      try {
        // STEP 1: Get the shop details to find the correct merchant UID
        const shopSnap = await getDoc(doc(db, "shops", id));
        
        if (shopSnap.exists()) {
          const shopData = shopSnap.data();
          // We look for 'ownerUid' first, otherwise fallback to the 'id' itself
          const targetUid = shopData.ownerUid || id; 

          // STEP 2: Listen to the correct 'metabase' document using that UID
          const menuRef = doc(db, "metabase", targetUid);
          
          const unsubscribe = onSnapshot(menuRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const allItems = data.items || [];
              // Only show items that are marked Available
              setMenuItems(allItems.filter(item => item.isAvailable === true));
            } else {
              console.warn("No menu found for UID:", targetUid);
              setMenuItems([]);
            }
            setLoading(false);
          });
          return unsubscribe;
        } else {
          console.error("Shop document does not exist for ID:", id);
          setLoading(false);
        }
      } catch (err) {
        console.error("Firebase Error:", err);
        setLoading(false);
      }
    };

    const unsubPromise = fetchMenuData();
    return () => {
      unsubPromise.then(unsub => unsub && unsub());
    };
  }, [id]);

  // Total calculation handling both 'Price' and 'price'
  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.Price || item.price) || 0), 0);
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

  const groupedItems = useMemo(() => {
    return filteredMenuItems.reduce((acc, item) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [filteredMenuItems]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-orange-600"></div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-950 min-h-screen pb-40 transition-colors">
      <header className="mb-6">
        <button onClick={() => router.back()} className="mb-4 text-orange-600 font-black flex items-center gap-1 uppercase text-[10px] tracking-widest hover:translate-x-[-4px] transition-transform">← Back</button>
        <h1 className="text-3xl font-black dark:text-white mb-4 uppercase tracking-tighter">Menu</h1>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search snacks..."
            className="w-full pl-12 pr-10 py-4 bg-gray-50 dark:bg-gray-900 rounded-[1.5rem] outline-none text-gray-800 dark:text-white border border-transparent focus:border-orange-200 dark:focus:border-orange-900/30 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="space-y-6">
        {Object.keys(groupedItems).length > 0 ? (
          Object.keys(groupedItems).map(cat => (
            <div key={cat} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
              <button 
                onClick={() => setOpenCategories(p => ({...p, [cat]: !p[cat]}))}
                className="w-full flex justify-between items-center py-4 group"
              >
                <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] group-hover:text-orange-500 transition-colors">{cat}</h2>
                <ChevronDown size={20} className={`transition-transform duration-300 ${openCategories[cat] ? 'rotate-180 text-orange-500' : 'text-gray-300'}`} />
              </button>

              {openCategories[cat] && (
                <div className="space-y-3 pb-6 animate-in slide-in-from-top-2 duration-300">
                  {groupedItems[cat].map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-[2rem] border border-transparent hover:shadow-lg hover:shadow-orange-500/5 transition-all">
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleFavorite(item.id)} className="active:scale-150 transition-transform">
                          <Heart size={20} className={favorites.includes(item.id) ? "text-red-500 fill-red-500" : "text-gray-300"} />
                        </button>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white leading-tight">{item.name}</p>
                          <p className="text-orange-600 font-black text-sm">₹{item.Price || item.price}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => addToCart(item)} 
                        className="bg-white dark:bg-gray-800 text-orange-600 shadow-sm w-12 h-10 rounded-2xl flex items-center justify-center font-black text-lg active:scale-90 transition-all border border-gray-100 dark:border-gray-700"
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
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/20 rounded-[3rem]">
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Kitchen is currently empty</p>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-8 left-0 right-0 px-4 z-50 flex justify-center">
          <div className="w-full max-w-md bg-orange-600 text-white p-5 rounded-[2.5rem] shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex flex-col pl-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-none mb-1">Items in Tray</span>
              <span className="font-black text-base leading-none">{cart.length} Snacks • ₹{total}</span>
            </div>
            <button onClick={() => router.push('/checkout')} className="bg-white text-orange-600 px-8 py-3 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-black/10">
              Checkout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}