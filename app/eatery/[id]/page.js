'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore'; 
import { ChevronDown, Search, Heart, Minus, Plus } from 'lucide-react';

export default function Menu() {
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState({ Favorites: true });
  const [openSubCategories, setOpenSubCategories] = useState({}); // New for Nested Ramyun
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState({});
  
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

    const fetchMenuData = async () => {
      try {
        const merchantMap = {
          "campus-ins": "z5LGdNyWzITAWjwSKDbc3T1pIgJ2",
          "campus-bites": "brTUNoAaOeQgHGBLxc6nSg21tYK2"
        };
        let targetUid = merchantMap[id] || id;
        const shopSnap = await getDoc(doc(db, "shops", id));
        if (shopSnap.exists()) {
          targetUid = shopSnap.data().ownerUid || targetUid;
        }

        const menuRef = doc(db, "metabase", targetUid);
        const unsubscribe = onSnapshot(menuRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setHiddenCategories(data.hiddenCategories || []);
            setMenuItems(data.items || []);
          } else {
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
    return () => { unsubPromise.then(unsub => unsub && unsub()); };
  }, [id]);

  const getItemQuantity = (itemId) => {
    const item = cart.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  };

  const updateCart = (item, delta) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(i => i.id !== item.id);
        return prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i);
      }
      if (delta > 0) {
        return [...prev, { ...item, quantity: 1, category: item.category || "General" }];
      }
      return prev;
    });
  };

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price || item.Price || 0) * (item.quantity || 1)), 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
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

  const toggleFavorite = (itemId) => {
    const updatedFavs = favorites.includes(itemId) ? favorites.filter(fid => fid !== itemId) : [...favorites, itemId];
    setFavorites(updatedFavs);
    localStorage.setItem('fav_items', JSON.stringify(updatedFavs));
  };

  // --- UPDATED GROUPING LOGIC FOR NESTED CATEGORIES ---
  const groupedItems = useMemo(() => {
    const groups = {};
    const filtered = menuItems.filter(item => 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subCategory?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    filtered.forEach(item => {
      const cat = item.category?.trim() || 'General';
      if (!groups[cat]) groups[cat] = {};

      const target = item.subCategory ? item.subCategory : "ITEMS";
      if (!groups[cat][target]) groups[cat][target] = [];

      // Maintain your Variant Logic inside the groupings
      const variantMatch = item.name.match(/(.+)\s\((.+)\)/);
      if (variantMatch) {
        const baseName = variantMatch[1].trim();
        const variantType = variantMatch[2].trim();
        let existingBase = groups[cat][target].find(g => g.isVariantGroup && g.name === baseName);
        if (existingBase) existingBase.variants.push({ ...item, variantType });
        else groups[cat][target].push({ id: `group-${baseName}-${cat}`, name: baseName, isVariantGroup: true, variants: [{ ...item, variantType }] });
      } else {
        groups[cat][target].push({ ...item, isVariantGroup: false });
      }
    });
    return groups;
  }, [menuItems, searchQuery]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#050505]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-orange-600"></div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-[#050505] min-h-screen pb-32 transition-colors">
      <header className="mb-8">
        <button onClick={() => router.back()} className="text-orange-600 font-bold uppercase text-[10px] mb-4 tracking-[0.2em] flex items-center gap-1">
          <span className="text-lg">←</span> Back
        </button>
        <h1 className="text-5xl font-black dark:text-white mb-6 uppercase tracking-tighter italic leading-none">Menu</h1>
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" placeholder="Search for snacks..." 
            className="w-full pl-14 pr-6 py-5 bg-gray-100/50 dark:bg-gray-900/50 rounded-3xl outline-none text-gray-800 dark:text-white border border-transparent focus:border-orange-500/20 transition-all font-bold text-sm backdrop-blur-md" 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
      </header>

      <div className="space-y-10">
        {Object.keys(groupedItems).map(cat => {
          const isCategoryHidden = hiddenCategories.includes(cat);
          return (
            <div key={cat} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={() => setOpenCategories(p => ({...p, [cat]: !p[cat]}))} 
                className="w-full flex justify-between items-end pb-3 border-b-2 border-gray-100 dark:border-gray-900 mb-6 group"
              >
                <h2 className={`text-sm font-black uppercase tracking-[0.25em] ${isCategoryHidden ? 'text-gray-400' : 'text-orange-600'}`}>
                  {cat}
                </h2>
                <ChevronDown size={16} className={`transition-transform duration-500 ${openCategories[cat] ? 'rotate-180 text-orange-500' : 'text-gray-400'}`} />
              </button>

              {openCategories[cat] && (
                <div className="space-y-6">
                  {Object.keys(groupedItems[cat]).map(subOrItems => {
                    // --- CASE 1: Normal Items (No Sub-Category) ---
                    if (subOrItems === "ITEMS") {
                      return groupedItems[cat][subOrItems].map(group => (
                        <MenuItem 
                          key={group.id} 
                          group={group} 
                          isAvailable={!isCategoryHidden && group.isAvailable !== false}
                          favorites={favorites}
                          toggleFavorite={toggleFavorite}
                          getItemQuantity={getItemQuantity}
                          updateCart={updateCart}
                          selectedVariants={selectedVariants}
                          setSelectedVariants={setSelectedVariants}
                        />
                      ));
                    }

                    // --- CASE 2: Nested Sub-Category (e.g., FIERY HOT) ---
                    const subKey = `${cat}-${subOrItems}`;
                    return (
                      <div key={subOrItems} className="ml-2 border-l-2 border-gray-100 dark:border-gray-900 pl-4 mb-8">
                        <button 
                          onClick={() => setOpenSubCategories(p => ({...p, [subKey]: !p[subKey]}))}
                          className="w-full flex justify-between items-center py-2 mb-4"
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">{subOrItems}</span>
                          <ChevronDown size={12} className={`transition-transform ${openSubCategories[subKey] ? 'rotate-180 text-orange-500' : ''}`} />
                        </button>
                        
                        {openSubCategories[subKey] && (
                          <div className="space-y-6">
                            {groupedItems[cat][subOrItems].map(group => (
                              <MenuItem 
                                key={group.id} 
                                group={group} 
                                isAvailable={!isCategoryHidden && group.isAvailable !== false}
                                favorites={favorites}
                                toggleFavorite={toggleFavorite}
                                getItemQuantity={getItemQuantity}
                                updateCart={updateCart}
                                selectedVariants={selectedVariants}
                                setSelectedVariants={setSelectedVariants}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-10 left-0 right-0 px-6 z-50 flex justify-center">
          <div className="w-full max-w-md bg-orange-600 text-white p-5 rounded-[2.8rem] shadow-[0_20px_50px_rgba(249,115,22,0.4)] flex items-center justify-between">
            <div className="flex flex-col pl-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-0.5">Your Tray</span>
              <span className="font-black text-lg italic">{cartItemCount} Items • ₹{total}</span>
            </div>
            <button onClick={() => router.push('/checkout')} className="bg-white text-orange-600 px-10 py-4 rounded-[1.8rem] font-black text-[12px] uppercase tracking-widest">Checkout →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Menu Item Component to keep logic dry
function MenuItem({ group, isAvailable, favorites, toggleFavorite, getItemQuantity, updateCart, selectedVariants, setSelectedVariants }) {
  const isGroup = group.isVariantGroup;
  const activeItem = isGroup ? (selectedVariants[group.id] || group.variants[0]) : group;
  const itemQty = getItemQuantity(activeItem.id);

  return (
    <div className={`group relative flex items-center justify-between p-1 transition-all ${!isAvailable ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
      <div className="flex flex-1 items-start gap-4">
        <button onClick={() => isAvailable && toggleFavorite(activeItem.id)} className="mt-1">
          <Heart size={18} className={favorites.includes(activeItem.id) ? "text-red-500 fill-red-500" : "text-gray-300"} />
        </button>
        <div className="flex-1">
          <p className="font-bold text-gray-800 dark:text-gray-100 text-[15px] tracking-tight">{group.name}</p>
          {isGroup ? (
            <div className="mt-2 inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-xl border border-gray-100 dark:border-gray-800">
              <select 
                className="bg-transparent font-black text-[9px] uppercase outline-none text-orange-600 appearance-none" 
                value={activeItem.id} 
                onChange={(e) => setSelectedVariants(prev => ({...prev, [group.id]: group.variants.find(v => v.id === e.target.value)}))}
              >
                {group.variants.map(v => <option key={v.id} value={v.id}>{v.variantType} • ₹{v.price || v.Price}</option>)}
              </select>
              <ChevronDown size={10} className="text-orange-600" />
            </div>
          ) : (
            <p className="font-black text-sm mt-1 text-orange-600">₹{activeItem.price || activeItem.Price}</p>
          )}
        </div>
      </div>
      <div className="flex items-center ml-4">
        {isAvailable ? (
          itemQty > 0 ? (
            <div className="flex items-center bg-orange-600 text-white rounded-2xl overflow-hidden shadow-lg">
              <button onClick={() => updateCart(activeItem, -1)} className="p-3"><Minus size={12} strokeWidth={4} /></button>
              <span className="w-5 text-center font-black text-xs">{itemQty}</span>
              <button onClick={() => updateCart(activeItem, 1)} className="p-3"><Plus size={12} strokeWidth={4} /></button>
            </div>
          ) : (
            <button onClick={() => updateCart(activeItem, 1)} className="bg-white dark:bg-[#111] text-orange-600 px-5 py-2.5 rounded-[1.2rem] font-black text-[10px] border-2 border-orange-600/20 uppercase tracking-widest shadow-sm">Add +</button>
          )
        ) : (
          <span className="text-[8px] font-black text-gray-400 uppercase italic">Sold Out</span>
        )}
      </div>
    </div>
  );
}