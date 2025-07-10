"use client";

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SearchPage() {
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{id: number; title: string; url: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // TODO: Implement actual search functionality
      // This is a placeholder for your search logic
      console.log('Searching for:', searchQuery);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Placeholder results
      setSearchResults([
        { id: 1, title: 'Sample Result 1', url: 'https://example.com/1' },
        { id: 2, title: 'Sample Result 2', url: 'https://example.com/2' },
      ]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-sky-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-500">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Image 
                src="/Sluglet Logo.svg" 
                alt="Sluglet Logo" 
                width={40} 
                height={40}
              />
              <h1 className="ml-3 text-xl font-semibold text-gray-800">Sluglet Search</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user.email}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Search Your URLs</h2>
          <p className="text-blue-100 text-lg">Find and manage your shortened URLs</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by URL, slug, or description..."
                className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-white/20 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:border-white/40 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-white text-sky-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Search Results</h3>
            <div className="space-y-4">
              {searchResults.map((result: any) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <h4 className="font-medium text-gray-800">{result.title}</h4>
                  <p className="text-blue-600 text-sm mt-1">{result.url}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && searchResults.length === 0 && searchQuery && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No results found</h3>
            <p className="text-gray-600">Try adjusting your search terms or create a new URL</p>
          </div>
        )}

        {/* Initial State */}
        {!isLoading && searchResults.length === 0 && !searchQuery && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to search?</h3>
            <p className="text-gray-600">Enter your search terms above to find your URLs</p>
          </div>
        )}
      </div>
    </div>
  );
} 