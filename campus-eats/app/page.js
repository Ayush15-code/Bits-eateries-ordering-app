'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from './lib/firebase'; // Ensure your auth is exported from lib/firebase.js
import { signInWithEmailAndPassword } from 'firebase/auth';
import { loginUser } from './lib/auth';

export default function LoginPage() {
  const [isMerchant, setIsMerchant] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { role } = await loginUser(email, password, isMerchant);

      if (role === 'merchant') {
        router.push('/merchant/dashboard'); // Path: app/merchant/dashboard/page.js
      } else {
        router.push('/eatery'); // Path: app/eateries/page.js
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">

        {/* Header with Merchant Toggle */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900">
            {isMerchant ? "Merchant" : "Student"} <span className="text-orange-600">Login</span>
          </h1>
          <button
            onClick={() => setIsMerchant(!isMerchant)}
            className="text-xs font-bold text-gray-400 hover:text-orange-600 transition-colors uppercase tracking-widest"
          >
            {isMerchant ? "Student Login?" : "Merchant?"}
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-600 ml-1">BITS Email</label>
            <input
              type="email"
              placeholder="f202XXXX@goa.bits-pilani.ac.in"
              className="w-full p-4 mt-1 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 transition-all outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600 ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-4 mt-1 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 transition-all outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${isMerchant ? 'bg-gray-900' : 'bg-orange-500'}`}
          >
            Sign In
          </button>
        </form>

        {!isMerchant && (
          <p className="mt-6 text-center text-sm text-gray-500">
            New here? <span className="text-orange-600 font-bold cursor-pointer">Create Account</span>
          </p>
        )}
      </div>

      <p className="mt-8 text-xs text-gray-400 font-medium">CampusEats • BITS Pilani Goa Campus</p>
    </div>
  );
}