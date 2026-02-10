'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from './lib/firebase';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [isMerchant, setIsMerchant] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // GOOGLE LOGIN HANDLER (BITS EXCLUSIVE)
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    // Suggest the BITS domain in the account picker
    provider.setCustomParameters({ hd: "bits-pilani.ac.in" });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Validate Domain
      const email = user.email || "";
      const isBitsEmail = email.endsWith("@bits-pilani.ac.in") || 
                         email.endsWith(".bits-pilani.ac.in");

      if (!isBitsEmail) {
        await signOut(auth); // Immediately boot unauthorized users
        setError("Access Denied: Use your BITS Pilani email ID.");
        setLoading(false);
        return;
      }

      window.location.replace('/eatery'); 
    } catch (err) {
      console.error(err);
      setError("Google Login failed. Please try again.");
      setLoading(false);
    }
  };

  // MERCHANT LOGIN HANDLER (EMAIL/PASS)
  const handleMerchantLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.replace('/merchant/dashboard');
    } catch (err) {
      setError("Invalid merchant credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 font-sans transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            {isMerchant ? "Merchant" : "Student"} <span className="text-orange-600">Login</span>
          </h1>
          <button
            onClick={() => { setIsMerchant(!isMerchant); setError(''); }}
            className="text-[10px] font-bold text-gray-400 dark:text-gray-500 hover:text-orange-600 transition-colors uppercase tracking-widest border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-full"
          >
            Switch to {isMerchant ? "Student" : "Merchant"}
          </button>
        </div>

        {isMerchant ? (
          /* MERCHANT FORM (Email/Pass) */
          <form onSubmit={handleMerchantLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Merchant Email</label>
              <input
                type="email"
                placeholder="merchant@campus.com"
                className="w-full p-4 mt-1 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
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
                className="w-full p-4 mt-1 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-white shadow-lg bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all"
            >
              {loading ? "Verifying..." : "Sign In as Merchant"}
            </button>
          </form>
        ) : (
          /* STUDENT LOGIN (Google Only) */
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-500 mb-4">Secure access for BITS Pilani students only.</p>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold bg-white dark:bg-white text-black border border-gray-200 shadow-md hover:bg-gray-50 active:scale-95 transition-all"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              {loading ? "Signing in..." : "Continue with BITS ID"}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
            <p className="text-red-500 dark:text-red-400 text-xs font-bold text-center">{error}</p>
          </div>
        )}
      </div>

      <p className="mt-8 text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest text-center">
        CampusEats • BITS Pilani<br/>KK Birla Goa Campus
      </p>
    </div>
  );
}