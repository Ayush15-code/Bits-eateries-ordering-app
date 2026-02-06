"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
// We use the @ alias because it works in your Dashboard file
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
      // Logic for Merchant
      window.location.replace('/merchant/dashboard');
    } else {
      // Logic for Student
      window.location.replace('/eatery'); 
    }
  } catch (err) {
    setError("Invalid email or password.");
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">

        {/* Header with Merchant Toggle */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900">
            {isMerchant ? "Merchant" : "Student"} <span className="text-orange-600">Login</span>
          </h1>
          <button
            onClick={() => { setIsMerchant(!isMerchant); setError(''); }}
            className="text-[10px] font-bold text-gray-400 hover:text-orange-600 transition-colors uppercase tracking-widest border border-gray-200 px-3 py-1 rounded-full"
          >
            Switch to {isMerchant ? "Student" : "Merchant"}
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Email</label>
            <input
              type="email"
              placeholder={isMerchant ? "merchant@campus.com" : "student@bits.com"}
              className="w-full p-4 mt-1 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 transition-all outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-4 mt-1 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 transition-all outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-xl border border-red-100">
              <p className="text-red-500 text-xs font-bold text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${
              isMerchant ? 'bg-gray-900 hover:bg-black' : 'bg-orange-600 hover:bg-orange-700'
            } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        {!isMerchant && (
          <p className="mt-6 text-center text-xs text-gray-400">
            Don't have an account? <span className="text-orange-600 font-bold cursor-pointer">Sign Up</span>
          </p>
        )}
      </div>

      <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest">CampusEats • BITS Pilani</p>
    </div>
  );
}