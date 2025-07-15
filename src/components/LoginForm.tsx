'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      // Session is handled by onAuthStateChanged in the main page
      console.log('Login successful:', data.user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Login failed');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Welcome Back</h2>
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full mb-4 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full mb-4 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      
      <div className="flex items-center mb-6">
        <input
          type="checkbox"
          id="rememberMe"
          checked={rememberMe}
          onChange={e => setRememberMe(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
          Remember me for 30 days
        </label>
      </div>
      
      <button
        type="submit"
        className="w-full bg-black text-white py-3 rounded-lg hover:bg-black transition"
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Log In'}
      </button>
      
      {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
    </form>
  );
} 