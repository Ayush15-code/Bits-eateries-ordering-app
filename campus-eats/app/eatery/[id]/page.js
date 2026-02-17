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
  const [openCategories, setOpenCategories] = useState({ Favorites: true });
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState({});

  const router = useRouter();
  const { id } = useParams(); // 'campus-ins' or 'campus-bites'

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
        // 1. Map Slugs to the IDs where you pushed the data
        const merchantMap = {
          "campus-ins": "z5LGdNyWzITAWjwSKDbc3T1pIgJ2",
          "campus-bites": "brTUNoAaOeQgHGBLxc6nSg21tYK2"
        };

        // 2. Determine which Firebase Document to read
        // It checks the map first, if not found, it uses the 'id' from URL
        let targetUid = merchantMap[id] || id;

        // 3. Fallback: Check 'shops' collection for ownerUid if slug isn't in map
        const shopSnap = await getDoc(doc(db, "shops", id));
        if (shopSnap.exists()) {
          targetUid = shopSnap.data().ownerUid || targetUid;
        }

        // 4. Live listener for the Menu
        const menuRef = doc(db, "metabase", targetUid);
        const unsubscribe = onSnapshot(menuRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const allItems = data.items || [];
            setMenuItems(allItems.filter(item => item.isAvailable === true));
          } else {
            console.warn(`No menu found for UID: ${targetUid}`);
            setMenuItems([]);
          }
          setLoading(false);
        });

        return unsubscribe;
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

  // Total Calculation
  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price || item.Price) || 0), 0);
  }, [cart]);

  // Sync to LocalStorage
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

  const addToCart = (item) => setCart(prev => [...prev, { ...item }]);

  const toggleFavorite = (itemId) => {
    const updatedFavs = favorites.includes(itemId) 
      ? favorites.filter(fid => fid !== itemId) 
      : [...favorites, itemId];
    setFavorites(updatedFavs);
    localStorage.setItem('fav_items', JSON.stringify(updatedFavs));
  };

  const filteredMenuItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter(item => 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuItems, searchQuery]);

  // Grouping Logic for Variants (Dosa dropdowns)
  const groupedItems = useMemo(() => {
    const groups = {};
    filteredMenuItems.forEach(item => {
      const cat = item.category || 'General';
      if (!groups[cat]) groups[cat] = [];

      const variantMatch = item.name.match(/(.+)\s\((.+)\)/);
      if (variantMatch) {
        const baseName = variantMatch[1].trim();
        const variantType = variantMatch[2].trim();
        let existingBase = groups[cat].find(g => g.isVariantGroup && g.name === baseName);
        if (existingBase) {
          existingBase.variants.push({ ...item, variantType });
        } else {
          groups[cat].push({
            id: `group-${baseName}-${cat}`,
            name: baseName,
            isVariantGroup: true,
            variants: [{ ...item, variantType }]
          });
        }
      } else {
        groups[cat].push({ ...item, isVariantGroup: false });
      }
    });
    return groups;
  }, [filteredMenuItems]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-orange-600"></div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-950 min-h-screen pb-40">
      <header className="mb-6">
        <button onClick={() => router.back()} className="mb-4 text-orange-600 font-black uppercase text-[10px] tracking-widest">← Back</button>
        <h1 className="text-3xl font-black dark:text-white mb-4 uppercase tracking-tighter">Menu</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search snacks..."
            className="w-full pl-12 pr-10 py-4 bg-gray-50 dark:bg-gray-900 rounded-[1.5rem] outline-none text-gray-800 dark:text-white border border-transparent focus:border-orange-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="space-y-6">
        {Object.keys(groupedItems).length > 0 ? (
          Object.keys(groupedItems).map(cat => (
            <div key={cat} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2">
              <button 
                onClick={() => setOpenCategories(p => ({...p, [cat]: !p[cat]}))}
                className="w-full flex justify-between items-center py-4"
              >
                <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{cat}</h2>
                <ChevronDown size={20} className={`${openCategories[cat] ? 'rotate-180 text-orange-500' : 'text-gray-300'}`} />
              </button>

              {openCategories[cat] && (
                <div className="space-y-3 pb-4">
                  {groupedItems[cat].map(group => {
                    const isGroup = group.isVariantGroup;
                    const activeItem = isGroup ? (selectedVariants[group.id] || group.variants[0]) : group;

                    return (
                      <div key={group.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-[2rem]">
                        <div className="flex flex-1 items-center gap-4">
                          <button onClick={() => toggleFavorite(activeItem.id)}>
                            <Heart size={20} className={favorites.includes(activeItem.id) ? "text-red-500 fill-red-500" : "text-gray-300"} />
                          </button>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 dark:text-white leading-tight">{group.name}</p>
                            {isGroup ? (
                              <select 
                                className="mt-1 bg-transparent text-orange-600 font-black text-xs uppercase outline-none"
                                onChange={(e) => {
                                  const v = group.variants.find(v => v.id === e.target.value);
                                  setSelectedVariants(prev => ({...prev, [group.id]: v}));
                                }}
                              >
                                {group.variants.map(v => (
                                  <option key={v.id} value={v.id}>{v.variantType} - ₹{v.price}</option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-orange-600 font-black text-sm">₹{activeItem.price || activeItem.Price}</p>
                            )}
                          </div>
                        </div>
                        <button onClick={() => addToCart(activeItem)} className="bg-white dark:bg-gray-800 text-orange-600 w-12 h-10 rounded-2xl font-black text-lg shadow-sm border border-gray-100 dark:border-gray-700">+</button>
                      </div>
                    );
                  })}
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
          <div className="w-full max-w-md bg-orange-600 text-white p-5 rounded-[2.5rem] shadow-2xl flex items-center justify-between">
            <div className="flex flex-col pl-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-none mb-1">Tray</span>
              <span className="font-black text-base leading-none">{cart.length} Snacks • ₹{total}</span>
            </div>
            <button onClick={() => router.push('/checkout')} className="bg-white text-orange-600 px-8 py-3 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all">
              Checkout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}