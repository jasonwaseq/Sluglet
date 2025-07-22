"use client";

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  location: string;
  imageUrl?: string;
  images?: string[];
  amenities: string[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  availableFrom: string;
  createdAt: string;
  user: {
    email: string;
  };
}

export default function SearchPage() {
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [priceFilter, setPriceFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
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
    if (!searchQuery.trim() && !priceFilter && !locationFilter) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }
      if (priceFilter) {
        params.append('price', priceFilter);
      }
      if (locationFilter) {
        params.append('location', locationFilter);
      }

      const response = await fetch(`/api/listings?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }

      const data = await response.json();
      setSearchResults(data.listings || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleListingClick = (listingId: string) => {
    router.push(`/listings/${listingId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900">
      {/* Header */}
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

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              <span className="text-blue-200">Welcome, {user.email}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Search Listings</h2>
          <p className="text-blue-200 text-lg">Find your perfect rental property</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="bg-blue-800 rounded-2xl shadow-xl p-6 border border-blue-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, location, or description..."
                  className="w-full px-4 py-2 border border-blue-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-blue-700 text-white placeholder-blue-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Price Range</label>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-blue-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-blue-700 text-white"
                >
                  <option value="">Any Price</option>
                  <option value="0-1000">Under $1,000</option>
                  <option value="1000-2000">$1,000 - $2,000</option>
                  <option value="2000-3000">$2,000 - $3,000</option>
                  <option value="3000-5000">$3,000 - $5,000</option>
                  <option value="5000-+">$5,000+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Location</label>
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Enter location..."
                  className="w-full px-4 py-2 border border-blue-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-blue-700 text-white placeholder-blue-300"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-yellow-500 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">Search Results ({searchResults.length})</h3>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPriceFilter('');
                  setLocationFilter('');
                  setSearchResults([]);
                }}
                className="text-blue-200 hover:text-white text-sm"
              >
                Clear Search
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((listing) => (
                <div 
                  key={listing.id} 
                  className="bg-blue-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer border border-blue-700"
                  onClick={() => handleListingClick(listing.id)}
                >
                  {listing.imageUrl && (
                    <div className="h-48 bg-gray-200 relative">
                      <Image
                        src={listing.imageUrl}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-white text-lg line-clamp-2">{listing.title}</h4>
                      <span className="text-yellow-400 font-bold text-lg">{formatPrice(listing.price)}</span>
                    </div>
                    <p className="text-blue-200 text-sm mb-3 line-clamp-2">{listing.description}</p>
                    <div className="flex items-center text-blue-300 text-sm mb-3">
                      <span className="mr-4">📍 {listing.location}</span>
                      <span>📅 {listing.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-300">Available: {listing.availableFrom}</span>
                      <span className="text-blue-300">Posted: {formatDate(listing.createdAt)}</span>
                    </div>
                    {listing.amenities && listing.amenities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {listing.amenities.slice(0, 3).map((amenity, index) => (
                          <span 
                            key={index}
                            className="bg-blue-700 text-blue-200 px-2 py-1 rounded-full text-xs"
                          >
                            {amenity}
                          </span>
                        ))}
                        {listing.amenities.length > 3 && (
                          <span className="text-blue-300 text-xs">+{listing.amenities.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && searchResults.length === 0 && (searchQuery || priceFilter || locationFilter) && (
          <div className="bg-blue-800 rounded-2xl shadow-xl p-8 text-center border border-blue-700">
            <div className="text-blue-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No listings found</h3>
            <p className="text-blue-200">Try adjusting your search criteria or create a new listing</p>
            <button
              onClick={() => router.push('/create-listing')}
              className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
            >
              Create Listing
            </button>
          </div>
        )}

        {/* Initial State */}
        {!isLoading && searchResults.length === 0 && !searchQuery && !priceFilter && !locationFilter && (
          <div className="bg-blue-800 rounded-2xl shadow-xl p-8 text-center border border-blue-700">
            <div className="text-blue-400 text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-white mb-2">Ready to find your perfect place?</h3>
            <p className="text-blue-200 mb-4">Search by location, price range, or keywords to find available listings</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/listings')}
                className="bg-yellow-500 text-blue-900 px-6 py-2 rounded-lg hover:bg-yellow-400 transition font-semibold"
              >
                Browse All Listings
              </button>
              <button
                onClick={() => router.push('/create-listing')}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition font-semibold"
              >
                Create Listing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 