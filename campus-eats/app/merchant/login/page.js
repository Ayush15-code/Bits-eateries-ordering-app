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
    setError("Checking..."); // Visual feedback that the button was clicked

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Auth Success for UID:", user.uid);

      // FORCE REDIRECT: We navigate first, then let the dashboard handle the check.
      // This proves if your routing works.
      window.location.href = '/merchant/dashboard';

    } catch (err) {
      console.error("Login Error:", err.code);
      if (err.code === 'auth/user-not-found') setError("Email not registered.");
      else if (err.code === 'auth/wrong-password') setError("Wrong password.");
      else setError("Error: " + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-10 mt-20 bg-white rounded-3xl shadow-xl border border-gray-100 font-sans">
      <h1 className="text-3xl font-black text-gray-800 mb-6">Merchant Log In</h1>
      
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-orange-500"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-orange-500"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {error && <p className="text-orange-600 text-sm font-bold bg-orange-50 p-2 rounded-lg text-center">{error}</p>}
        
        <button type="submit" className="w-full bg-orange-600 text-white p-4 rounded-xl font-black shadow-lg hover:bg-orange-700 transition-all">
          ENTER DASHBOARD
        </button>
      </form>
    </div>
  );
}