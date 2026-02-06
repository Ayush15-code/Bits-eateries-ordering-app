'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from './lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [isMerchant, setIsMerchant] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (isMerchant) {
        window.location.replace('/merchant/dashboard');
      } else {
        window.location.replace('/eatery'); 
      }
    } catch (err) {
      setError("Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    /* 1. Main Container: Added dark:bg-gray-950 and transition */
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 font-sans transition-colors duration-300">
      
      {/* 2. Login Card: Added dark:bg-gray-900 and dark:border-gray-800 */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">

        {/* Header with Merchant Toggle */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            {isMerchant ? "Merchant" : "Student"} <span className="text-orange-600">Login</span>
          </h1>
          <button
            onClick={() => { setIsMerchant(!isMerchant); setError(''); }}
            /* 3. Toggle Button: Added dark:border-gray-700 and dark:text-gray-400 */
            className="text-[10px] font-bold text-gray-400 dark:text-gray-500 hover:text-orange-600 transition-colors uppercase tracking-widest border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-full"
          >
            Switch to {isMerchant ? "Student" : "Merchant"}
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 ml-1 uppercase">Email</label>
            <input
              type="email"
              placeholder={isMerchant ? "merchant@campus.com" : "student@bits.com"}
              /* 4. Inputs: Added dark:bg-gray-800 and dark:text-white */
              className="w-full p-4 mt-1 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 transition-all outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 ml-1 uppercase">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-4 mt-1 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 transition-all outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* 5. Error Box: Added dark:bg-red-900/20 */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
              <p className="text-red-500 dark:text-red-400 text-xs font-bold text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            /* 6. Sign In Button: Added dark:bg-white dark:text-black for Student and dark:bg-orange-500 for Merchant */
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${
              isMerchant 
                ? 'bg-gray-900 hover:bg-black dark:bg-orange-600 dark:hover:bg-orange-700' 
                : 'bg-orange-600 hover:bg-orange-700 dark:bg-white dark:text-black dark:hover:bg-gray-200'
            } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        {!isMerchant && (
          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
            Don't have an account? <span className="text-orange-600 font-bold cursor-pointer">Sign Up</span>
          </p>
        )}
      </div>

      <p className="mt-8 text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest text-center">
        CampusEats • BITS Pilani<br/>KK Birla Goa Campus
      </p>
    </div>
  );
}