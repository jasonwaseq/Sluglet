"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

// Mock data - replace with real API calls
const mockListings = [
  {
    id: 1,
    title: "Cozy Studio in Downtown",
    price: 1200,
    duration: "6 months",
    location: "Downtown",
    description: "Beautiful studio apartment with great amenities",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop"
  },
  {
    id: 2,
    title: "2BR Apartment Near Campus",
    price: 800,
    duration: "3 months",
    location: "University District",
    description: "Perfect for students, fully furnished",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop"
  },
  {
    id: 3,
    title: "Luxury 1BR with City View",
    price: 1500,
    duration: "12 months",
    location: "Midtown",
    description: "High-end apartment with amazing city views",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop"
  }
];

export default function ListingsPage() {
  const [listings, setListings] = useState(mockListings);
  const [filteredListings, setFilteredListings] = useState(mockListings);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Apply search filters
    const query = searchParams.get('q') || '';
    const price = searchParams.get('price') || '';
    const duration = searchParams.get('duration') || '';

    let filtered = listings;

    // Filter by search query
    if (query) {
      filtered = filtered.filter(listing => 
        listing.title.toLowerCase().includes(query.toLowerCase()) ||
        listing.location.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter by price range
    if (price) {
      filtered = filtered.filter(listing => {
        const [min, max] = price.split('-').map(p => p === '+' ? Infinity : parseInt(p));
        return listing.price >= min && (max === Infinity ? true : listing.price <= max);
      });
    }

    // Filter by duration
    if (duration) {
      filtered = filtered.filter(listing => {
        const [min, max] = duration.split('-').map(d => d === '+' ? Infinity : parseInt(d));
        const listingDuration = parseInt(listing.duration.split(' ')[0]);
        return listingDuration >= min && (max === Infinity ? true : listingDuration <= max);
      });
    }

    setFilteredListings(filtered);
  }, [searchParams, listings]);

  const handleListingClick = (listingId: number) => {
    router.push(`/listings/${listingId}`);
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

            {/* Search Results Info */}
            <div className="flex-1 text-center">
              <h1 className="text-xl font-semibold text-white">
                Search Results ({filteredListings.length} listings)
              </h1>
            </div>

            {/* Back to Dashboard */}
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-blue-200 hover:text-white transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Listings Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-white mb-4">No listings found</h2>
            <p className="text-blue-200 mb-6">Try adjusting your search criteria</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
            >
              Back to Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => handleListingClick(listing.id)}
                className="bg-blue-800 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow border border-blue-700"
              >
                <div className="relative h-48">
                  <Image
                    src={listing.image}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {listing.title}
                  </h3>
                  <p className="text-blue-200 mb-4">
                    {listing.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-yellow-400">
                      ${listing.price}/month
                    </span>
                    <span className="text-sm text-blue-300">
                      {listing.duration}
                    </span>
                  </div>
                  <p className="text-sm text-blue-300 mt-2">
                    📍 {listing.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 