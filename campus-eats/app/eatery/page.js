'use client';
import Link from 'next/link';

const EATERIES = [
  { id: 'campus-bites', name: 'Food King', icon: '🍕', desc: 'Best Pizzas & Burgers' },
  { id: 'caffeine-hub', name: 'Ice and Spice', icon: '☕', desc: 'Coffee & Snacks' },
  { id: 'red-chillies', name: 'Red Chillies', icon: '🍛', desc: 'Indian Main Course' }
];

export default function EateriesList() {
  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-4xl font-black text-orange-600">CampusEats</h1>
        <p className="text-gray-500">BITS Pilani, KK Birla Goa Campus</p>
      </header>

      <div className="grid gap-4">
        {EATERIES.map((eatery) => (
          <Link key={eatery.id} href={`/eatery/${eatery.id}`}>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{eatery.icon}</span>
                <div>
                  <h3 className="text-lg font-bold">{eatery.name}</h3>
                  <p className="text-sm text-gray-500">{eatery.desc}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}