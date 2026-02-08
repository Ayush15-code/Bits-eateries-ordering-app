"use client";
import { useState } from 'react';
import { auth, db } from '../../lib/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function MerchantLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
  e.preventDefault();
  setError(''); // Clear previous errors
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 1. Set the cookie for the Middleware
    document.cookie = "userRole=merchant; path=/; max-age=86400; SameSite=Lax";

    // 2. Double check Firestore document exists before redirecting
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
       setError("Account error: No shop linked to this merchant UID in Firestore.");
       return;
    }

    // 3. Successful redirect
    router.push('/merchant/dashboard');
  } catch (err) {
    setError(err.message);
  }
};

  return (
    /* 1. Page Background: Wrapped in a full-screen div for background consistency */
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6 transition-colors duration-300">
      
      {/* 2. Login Card: Added dark:bg-gray-900 and dark:border-gray-800 */}
      <div className="w-full max-w-md p-10 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 font-sans">
        
        {/* 3. Heading: Added dark:text-white */}
        <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-6">
          Merchant <span className="text-orange-600">Log In</span>
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            /* 4. Inputs: Added dark:bg-gray-800 and dark:text-white */
            className="w-full p-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border-none outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border-none outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {/* 5. Error Message: Added dark:bg-orange-950/30 */}
          {error && (
            <p className="text-orange-600 dark:text-orange-400 text-sm font-bold bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-center border border-orange-100 dark:border-orange-900/30">
              {error}
            </p>
          )}
          
          <button 
            type="submit" 
            className="w-full bg-orange-600 text-white p-4 rounded-xl font-black shadow-lg hover:bg-orange-700 active:scale-95 transition-all"
          >
            ENTER DASHBOARD
          </button>
        </form>

        <p className="mt-8 text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest text-center">
          BITS Pilani Goa • Merchant Portal
        </p>
      </div>
    </div>
  );
}