"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import SignupForm from '@/components/SignupForm';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

export default function Home() {
  const [showSignup, setShowSignup] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div 
      className="min-h-screen w-full bg-sky-500 flex items-center justify-center"
      style={{
        minHeight: '100vh',
        width: '100%'
      }}
    >
      <main
        className="relative w-full min-h-screen flex flex-col items-center justify-center px-4 py-8"
        style={{
          width: '100%',
          minHeight: '100vh'
        }}
      >
        {/* Logo at the top middle */}
        <div 
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{
            top: '5%',
            width: 'min(25vw, 300px)',
            height: 'auto'
          }}
        >
          <Image 
            src="/Sluglet Logo.svg" 
            alt="Sluglet Logo" 
            width={300} 
            height={300}
            priority
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Auth UI */}
        <div 
          className="flex items-center justify-center"
          style={{
            marginTop: '25%',
            width: '100%',
            maxWidth: 'min(90vw, 500px)'
          }}
        >
          {user ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200 text-center">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Welcome, {user.email}!</h2>
              <button
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition"
                onClick={() => signOut(auth)}
              >
                Sign Out
              </button>
            </div>
          ) : showSignup ? (
            <div className="w-full">
              <SignupForm />
              <p className="mt-4 text-center">
                Already have an account?{' '}
                <button
                  className="text-blue-700 underline"
                  onClick={() => setShowSignup(false)}
                >
                  Log in
                </button>
              </p>
            </div>
          ) : (
            <div className="w-full">
              <LoginForm />
              <p className="mt-4 text-center">
                Don&apos;t have an account?{' '}
                <button
                  className="text-blue-700 underline"
                  onClick={() => setShowSignup(true)}
                >
                  Sign up
                </button>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 
