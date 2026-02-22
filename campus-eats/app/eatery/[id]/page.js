'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore'; 
import { ChevronDown, Search, Heart, Minus, Plus, Clock, ExternalLink } from 'lucide-react';

export default function Menu() {
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState({ Favorites: true });
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState({});
  
  // Keep activeOrder state for logic if needed, but we will remove the JSX rendering
  const [activeOrder, setActiveOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);

  const router = useRouter();
  const { id } = useParams(); 

  useEffect(() => {
    if (!id) return;
    
    const savedFavs = JSON.parse(localStorage.getItem('fav_items') || '[]');
    setFavorites(savedFavs);
    const savedCart = JSON.parse(localStorage.getItem('pending_cart') || '[]');
    const savedShopId = localStorage.getItem('pending_shop_id');
    const savedHistory = JSON.parse(localStorage.getItem('order_history') || '[]');
    setOrderHistory(savedHistory);
    
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
            setMenuItems((data.items || []).filter(item => item.isAvailable === true));
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

  // We can keep the listener to maintain consistency, or remove it entirely 
  // if the global ActiveOrderPopup handles everything.
  useEffect(() => {
    const activeId = localStorage.getItem('active_order_id');
    if (!activeId || activeId === "undefined" || activeId.length < 5) {
        setActiveOrder(null);
        return;
    }

    const unsub = onSnapshot(doc(db, "orders", activeId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === 'COLLECTED') {
          setActiveOrder(null);
          localStorage.removeItem('active_order_id');
        } else {
          setActiveOrder({ ...data, id: snap.id });
        }
      } else {
        setActiveOrder(null);
      }
    }, (error) => {
      console.warn("Order listener restricted.");
    });
    return () => unsub();
  }, []);

  const getItemQuantity = (itemId) => {
    const item = cart.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  };

  // Inside updateCart in app/eatery/[id]/page.js
const updateCart = (item, delta) => {
  setCart(prev => {
    const existing = prev.find(i => i.id === item.id);
    if (existing) {
      const newQty = existing.quantity + delta;
      if (newQty <= 0) return prev.filter(i => i.id !== item.id);
      return prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i);
    }
    if (delta > 0) {
      return [...prev, { 
        ...item, 
        quantity: 1, 
        // Explicitly pass the category from the menu item
        category: item.category || "General" 
      }];
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

  const filteredMenuItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter(item => item.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [menuItems, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups = {};
    filteredMenuItems.forEach(item => {
      const cat = item.category || 'General';
      if (hiddenCategories.includes(cat)) return;
      if (!groups[cat]) groups[cat] = [];
      const variantMatch = item.name.match(/(.+)\s\((.+)\)/);
      if (variantMatch) {
        const baseName = variantMatch[1].trim();
        const variantType = variantMatch[2].trim();
        let existingBase = groups[cat].find(g => g.isVariantGroup && g.name === baseName);
        if (existingBase) existingBase.variants.push({ ...item, variantType });
        else groups[cat].push({ id: `group-${baseName}-${cat}`, name: baseName, isVariantGroup: true, variants: [{ ...item, variantType }] });
      } else {
        groups[cat].push({ ...item, isVariantGroup: false });
      }
    });
    return groups;
  }, [filteredMenuItems, hiddenCategories]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#050505]"><div className="animate-spin rounded-full h-10 w-10 border-t-4 border-orange-600"></div></div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-950 min-h-screen pb-32 transition-colors">
      
      {/* --- REDUNDANT TOP STATUS BAR REMOVED --- */}

      <header className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => router.back()} className="text-orange-600 font-black uppercase text-[10px] tracking-widest">← Back</button>
          
        </div>
        <h1 className="text-4xl font-black dark:text-white mb-6 uppercase tracking-tighter">Menu</h1>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" size={20} />
          <input type="text" placeholder="Search items..." className="w-full pl-12 pr-10 py-4.5 bg-gray-50 dark:bg-gray-900 rounded-[1.8rem] outline-none text-gray-800 dark:text-white border border-transparent focus:border-orange-500/30 transition-all font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </header>

      {/* --- MENU LIST --- */}
<div className="space-y-8">
  {Object.keys(groupedItems).map(cat => (
    <div key={cat}>
      <button onClick={() => setOpenCategories(p => ({...p, [cat]: !p[cat]}))} className="w-full flex justify-between items-center py-2">
        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{cat}</h2>
        <ChevronDown size={18} className={`transition-transform duration-300 ${openCategories[cat] ? 'rotate-180 text-orange-500' : 'text-gray-300'}`} />
      </button>

      {openCategories[cat] && (
        <div className="space-y-4 mt-4">
          {groupedItems[cat].map(group => {
            const isGroup = group.isVariantGroup;
            const activeItem = isGroup ? (selectedVariants[group.id] || group.variants[0]) : group;
            const itemQty = getItemQuantity(activeItem.id);
            
            // Check availability: If explicitly false, it's unavailable. Otherwise, available.
            const isAvailable = activeItem.isAvailable !== false;

            return (
              <div key={group.id} className={`flex items-center justify-between p-5 bg-gray-50/50 dark:bg-gray-900/40 rounded-[2.2rem] transition-all ${!isAvailable ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                <div className="flex flex-1 items-center gap-4">
                  <button onClick={() => toggleFavorite(activeItem.id)}>
                    <Heart size={20} className={favorites.includes(activeItem.id) ? "text-red-500 fill-red-500" : "text-gray-300"} />
                  </button>
                  
                  <div className="flex-1">
                    {/* --- NAME & CATEGORY TAG --- */}
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-gray-800 dark:text-white text-base ${!isAvailable ? 'line-through' : ''}`}>
                        {group.name}
                      </p>
                      <span className="text-[7px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-1.5 py-0.5 rounded-md uppercase font-black tracking-tighter">
                        {activeItem.category || "General"}
                      </span>
                    </div>

                    {isGroup ? (
                      <select 
                        disabled={!isAvailable}
                        className="mt-1 bg-transparent text-orange-600 font-black text-[10px] uppercase outline-none" 
                        value={activeItem.id} 
                        onChange={(e) => setSelectedVariants(prev => ({...prev, [group.id]: group.variants.find(v => v.id === e.target.value)}))}
                      >
                        {group.variants.map(v => (
                          <option key={v.id} value={v.id}>{v.variantType} — ₹{v.price || v.Price}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-orange-600 font-black text-sm mt-0.5">₹{activeItem.price || activeItem.Price}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  {isAvailable ? (
                    itemQty > 0 ? (
                      <div className="flex items-center bg-orange-600 text-white rounded-2xl overflow-hidden shadow-lg shadow-orange-500/20">
                        <button onClick={() => updateCart(activeItem, -1)} className="p-3.5"><Minus size={14} strokeWidth={3} /></button>
                        <span className="w-5 text-center font-black text-sm">{itemQty}</span>
                        <button onClick={() => updateCart(activeItem, 1)} className="p-3.5"><Plus size={14} strokeWidth={3} /></button>
                      </div>
                    ) : (
                      <button onClick={() => updateCart(activeItem, 1)} className="bg-white dark:bg-gray-800 text-orange-600 w-12 h-11 rounded-2xl font-black text-xl border border-gray-100 dark:border-gray-700 shadow-sm">+</button>
                    )
                  ) : (
                    /* --- NOT AVAILABLE BADGE --- */
                    <span className="text-[8px] font-black text-red-500 uppercase px-3 py-2 border border-red-100 dark:border-red-900/30 rounded-xl bg-red-50/50 dark:bg-red-950/20">
                      Not Available
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  ))}
</div>

      {/* --- CART TRAY --- */}
      {cart.length > 0 && (
        <div className="fixed bottom-10 left-0 right-0 px-6 z-50 flex justify-center">
          <div className="w-full max-w-md bg-orange-600 text-white p-5 rounded-[2.8rem] shadow-[0_20px_50px_rgba(249,115,22,0.4)] flex items-center justify-between">
            <div className="flex flex-col pl-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Tray Summary</span>
              <span className="font-black text-lg">{cartItemCount} Snacks • ₹{total}</span>
            </div>
            <button onClick={() => router.push('/checkout')} className="bg-white text-orange-600 px-10 py-4 rounded-[1.8rem] font-black text-[12px] uppercase tracking-widest">Checkout →</button>
          </div>
        </div>
      )}
    </div>
  );
}