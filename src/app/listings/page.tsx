"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const params = new URLSearchParams();
        const query = searchParams.get('q') || '';
        const price = searchParams.get('price') || '';
        const duration = searchParams.get('duration') || '';

        if (query) params.append('q', query);
        if (price) params.append('price', price);
        if (duration) params.append('duration', duration);

        const response = await fetch(`/api/listings?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setListings(data.listings || []);
          setFilteredListings(data.listings || []);
        } else {
          console.error('Failed to fetch listings');
          // Fallback to mock data if API fails
          setListings([]);
          setFilteredListings([]);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
        setListings([]);
        setFilteredListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [searchParams]);

  const handleListingClick = (listingId: string) => {
    router.push(`/listings/${listingId}`);
  };

  const getListingImage = (listing: Listing) => {
    // Use uploaded images if available, otherwise fall back to imageUrl or default
    if (listing.images && listing.images.length > 0) {
      return listing.images[0];
    }
    if (listing.imageUrl) {
      return listing.imageUrl;
    }
    // Default placeholder image
    return "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading listings...</div>
      </div>
    );
  }

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
            <p className="text-blue-200 mb-6">Try adjusting your search criteria or create a new listing</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
              >
                Back to Search
              </button>
              <button
                onClick={() => router.push('/create-listing')}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
              >
                Create New Listing
              </button>
            </div>
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
                    src={getListingImage(listing)}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                  {/* Image count badge if multiple images */}
                  {listing.images && listing.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      +{listing.images.length - 1} more
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {listing.title}
                  </h3>
                  <p className="text-blue-200 mb-4 line-clamp-2">
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
                  {/* Show some amenities if available */}
                  {listing.amenities && listing.amenities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {listing.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="text-xs bg-blue-700 text-blue-200 px-2 py-1 rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                      {listing.amenities.length > 3 && (
                        <span className="text-xs text-blue-300">
                          +{listing.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 