"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import Image from 'next/image';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [duration, setDuration] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (priceRange) params.append('price', priceRange);
    if (duration) params.append('duration', duration);
    
    router.push(`/listings?${params.toString()}`);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900">
      {/* Navigation Bar */}
      <nav className="bg-blue-800 shadow-lg border-b border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center pt-1 hover:opacity-80 transition-opacity"
              >
                <Image 
                  src="/SlugletLogoYellow.svg" 
                  alt="Sluglet Logo" 
                  width={80} 
                  height={40}
                  priority
                />
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300"
                />
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="px-3 py-2 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white"
                >
                  <option value="">Any Price</option>
                  <option value="0-500">$0 - $500</option>
                  <option value="500-1000">$500 - $1000</option>
                  <option value="1000-1500">$1000 - $1500</option>
                  <option value="1500+">$1500+</option>
                </select>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="px-3 py-2 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white"
                >
                  <option value="">Any Duration</option>
                  <option value="1-3">1-3 months</option>
                  <option value="3-6">3-6 months</option>
                  <option value="6-12">6-12 months</option>
                  <option value="12+">12+ months</option>
                </select>
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Add Listing Button */}
              <button
                onClick={() => router.push('/create-listing')}
                className="p-2 bg-yellow-500 text-blue-900 rounded-full hover:bg-yellow-400 transition"
                title="Add Listing"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Profile Icon */}
              <button
                onClick={() => router.push('/profile')}
                className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-400 transition"
                title="Profile"
              >
                <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-blue-200 hover:text-white transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            Find Your Perfect Sublet
          </h1>
          <p className="text-lg text-blue-200 mb-8">
            Search for available sublets in your area or create your own listing
          </p>
          
          {/* Quick Actions */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/listings')}
              className="px-6 py-3 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
            >
              Browse All Listings
            </button>
            <button
              onClick={() => router.push('/create-listing')}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
            >
              Create New Listing
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 