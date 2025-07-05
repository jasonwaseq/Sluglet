'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement auth logic
    router.push('/dashboard');
  };

  return (
    <form onSubmit={handleLogin} className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 max-w-md w-full">
      <h2 className="text-2xl font-semibold mb-6 text-center">Welcome</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-4 p-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-6 p-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800"
        required
      />

      <button
        type="submit"
        className="w-full bg-black text-white py-3 rounded-lg hover:bg-black transition"
      >
        Login / Sign Up
      </button>
    </form>
  );
} 