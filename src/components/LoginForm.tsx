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
    <form 
      onSubmit={handleLogin} 
      className="bg-white bg-opacity-90 rounded-2xl shadow-xl w-full"
      style={{
        maxWidth: 'min(400px, 80vw)',
        minWidth: '280px',
        padding: 'min(2rem, 4vw)',
        aspectRatio: '1.2/1'
      }}
    >
      <h2 
        className="font-semibold mb-6 text-center"
        style={{
          fontSize: 'min(2rem, 5vw)',
          marginBottom: 'min(1.5rem, 3vw)'
        }}
      >
        Welcome
      </h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-4 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800"
        style={{
          fontSize: 'min(1rem, 3vw)',
          padding: 'min(0.75rem, 2vw)',
          marginBottom: 'min(1rem, 2vw)'
        }}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-6 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800"
        style={{
          fontSize: 'min(1rem, 3vw)',
          padding: 'min(0.75rem, 2vw)',
          marginBottom: 'min(1.5rem, 3vw)'
        }}
        required
      />

      <button
        type="submit"
        className="w-full bg-black text-white rounded-lg hover:bg-black transition"
        style={{
          fontSize: 'min(1rem, 3vw)',
          padding: 'min(0.75rem, 2vw)'
        }}
      >
        Login / Sign Up
      </button>
    </form>
  );
} 