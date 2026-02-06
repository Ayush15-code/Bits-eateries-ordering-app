"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Import these to make the login work
import { auth } from '../../lib/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function MerchantLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Navigate to the dashboard after successful login
      router.push('/merchant/dashboard'); 
      
    } catch (err) {
      // Better error messages for the user
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. Please try again.');
      } else {
        setError('Login failed. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-orange-50 p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
        <h1 className="text-2xl font-black text-center text-gray-800 mb-2">Merchant Portal</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">Login to manage your orders</p>
        
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm mb-4 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email Address</label>
            <input 
              type="email" 
              required
              autoComplete="username"
              className="w-full p-3 mt-1 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="shop@campus.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Password</label>
            <input 
              type="password" 
              required
              autoComplete="current-password"
              className="w-full p-3 mt-1 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>
      </div>
      
      <button 
        onClick={() => router.push('/')}
        className="mt-8 text-orange-600 font-bold text-sm"
      >
        ← Back to Student View
      </button>
    </div>
  );
}