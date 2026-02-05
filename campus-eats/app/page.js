"use client";
import Link from 'next/link';

const STORES = [
  { id: 'store1', name: "Food King", desc: "Best Pizzas & Burgers", emoji: "🍕" },
  { id: 'store2', name: "Subspot", desc: "Coffee & Snacks", emoji: "☕" }
];

export default function Home() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 p-6 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-orange-600">CampusEats</h1>
        <p className="text-gray-500">Delicious food, delivered to your counter.</p>
      </header>
      
      <h2 className="text-xl font-bold mb-4">Select Eatery</h2>
      {STORES.map(store => (
        <Link key={store.id} href={`/eatery/${store.id}`}>
          <div className="bg-white p-5 rounded-2xl shadow-sm mb-4 flex items-center cursor-pointer border-2 border-transparent hover:border-orange-500 transition-all">
            <span className="text-4xl mr-4">{store.emoji}</span>
            <div>
              <h2 className="font-bold text-lg text-gray-800">{store.name}</h2>
              <p className="text-gray-400 text-sm">{store.desc}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}