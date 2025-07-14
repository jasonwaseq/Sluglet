"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import SignupForm from '@/components/SignupForm';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function AuthPage() {
  const [showSignup, setShowSignup] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      // Redirect to dashboard if user is logged in
      if (firebaseUser) {
        router.push('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // If user is logged in, they'll be redirected to dashboard
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-blue-900 flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="mb-8">
        <Image 
          src="/SlugletLogoYellow.svg" 
          alt="Sluglet Logo" 
          width={300} 
          height={300}
          priority
        />
      </div>

      {/* Auth UI */}
      <div className="w-full max-w-md px-4">
        {showSignup ? (
          <div className="w-full">
            <SignupForm />
            <p className="mt-4 text-center text-blue-200">
              Already have an account?{' '}
              <button
                className="text-yellow-400 underline hover:text-yellow-300"
                onClick={() => setShowSignup(false)}
              >
                Log in
              </button>
            </p>
          </div>
        ) : (
          <div className="w-full">
            <LoginForm />
            <p className="mt-4 text-center text-blue-200">
              Don&apos;t have an account?{' '}
              <button
                className="text-yellow-400 underline hover:text-yellow-300"
                onClick={() => setShowSignup(true)}
              >
                Sign up
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 