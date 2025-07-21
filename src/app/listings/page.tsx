"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import DateRangePicker from '@/components/DateRangePicker';
import CityStateAutocomplete from '@/components/CityStateAutocomplete';
import { Suspense } from 'react';

interface Listing {
  id: string;
  title: string;
  description: string;
  address?: string | null;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  price: number;
  imageUrl?: string;
  images?: string[];
  amenities: string[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  availableFrom: string;
  availableTo: string;
  createdAt: string;
  user: {
    email: string;
  };
}

function ListingsPageContent() {
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search form state
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Available amenities options (same as create listing)
  const availableAmenities = [
    'Furnished',
    'WiFi',
    'Utilities Included',
    'On-Street Parking',
    'Driveway Parking',
    'Garage Parking',
    'Gym Access',
    'In-Unit Laundry',
    'Shared Laundry',
    'Air Conditioning',
    'Dishwasher',
    'Balcony'
  ];
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const params = new URLSearchParams();
        const cityParam = searchParams.get('city') || '';
        const stateParam = searchParams.get('state') || '';
        const price = searchParams.get('price') || '';
        const duration = searchParams.get('duration') || '';
        const amenities = searchParams.get('amenities') || '';

        // Check if there are any URL parameters
        const hasUrlParams = cityParam || stateParam || price || duration || amenities;
        
        if (hasUrlParams) {
          // Only populate form if there are URL parameters
          setCity(cityParam || '');
          setState(stateParam || '');
          
          if (price) {
            const [min, max] = price.split('-').map(p => p === '+' ? '' : p);
            setPriceMin(min || '');
            setPriceMax(max || '');
          }
          
          if (duration) {
            // Handle both formats: "start-end" and "start-start-end-end"
            const parts = duration.split('-');
            let start, end;
            
            if (parts.length === 2) {
              // Format: "start-end"
              [start, end] = parts;
            } else if (parts.length === 6) {
              // Format: "YYYY-MM-DD-YYYY-MM-DD" (e.g., "2025-07-14-2025-08-21")
              start = `${parts[0]}-${parts[1]}-${parts[2]}`;
              end = `${parts[3]}-${parts[4]}-${parts[5]}`;
            }
            
            if (start) {
              const startDateObj = new Date(start);
              setStartDate(startDateObj);
            }
            if (end) {
              const endDateObj = new Date(end);
              setEndDate(endDateObj);
            }
          }
          
          if (amenities) {
            setSelectedAmenities(amenities.split(','));
          }
        } else {
          // Clear all form fields when no URL parameters
          console.log('Clearing form fields - no URL parameters found');
          setCity('');
          setState('');
          setPriceMin('');
          setPriceMax('');
          setStartDate(null);
          setEndDate(null);
          setSelectedAmenities([]);
        }

        if (cityParam) params.append('city', cityParam);
        if (stateParam) params.append('state', stateParam);
        if (price) params.append('price', price);
        if (duration) params.append('duration', duration);
        if (amenities) params.append('amenities', amenities);

        console.log('API request URL:', `/api/listings?${params.toString()}`);
        const response = await fetch(`/api/listings?${params.toString()}`);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API response data:', data);
          setFilteredListings(data.listings || []);
        } else {
          const errorData = await response.text();
          console.error('Failed to fetch listings. Status:', response.status);
          console.error('Error response:', errorData);
          // Fallback to mock data if API fails
          setFilteredListings([]);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
        setFilteredListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (state) params.append('state', state);
    if (priceMin || priceMax) {
      const priceRange = priceMin && priceMax ? `${priceMin}-${priceMax}` : 
                        priceMin ? `${priceMin}+` : 
                        priceMax ? `0-${priceMax}` : '';
      if (priceRange) params.append('price', priceRange);
    }
    if (startDate && endDate) {
      const durationRange = `${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
      console.log('Creating duration range:', { startDate, endDate, durationRange });
      params.append('duration', durationRange);
    }
    if (selectedAmenities.length > 0) {
      params.append('amenities', selectedAmenities.join(','));
    }
    
    router.push(`/listings?${params.toString()}`);
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

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

  const formatDateRange = (from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    const fromFormatted = fromDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    const toFormatted = toDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    return `${fromFormatted} - ${toFormatted}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading listings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
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
              <h1 className="text-lg font-medium text-gray-900">
                {filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'} found
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/create-listing')}
                className="px-6 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-lg transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                Create Listing
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Simple Search Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Main Search Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <CityStateAutocomplete
                  key={`${city}-${state}`}
                  onCitySelect={(selectedCity, selectedState) => {
                    setCity(selectedCity);
                    setState(selectedState);
                  }}
                  initialCity={city}
                  initialState={state}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min $"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  min="0"
                  className="w-24 px-3 py-3 bg-white/90 backdrop-blur-sm border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 placeholder-gray-500 text-sm font-medium"
                />
                <input
                  type="number"
                  placeholder="Max $"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  min="0"
                  className="w-24 px-3 py-3 bg-white/90 backdrop-blur-sm border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 placeholder-gray-500 text-sm font-medium"
                />
              </div>
              
              <button
                type="submit"
                className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Search
              </button>
            </div>
            
            {/* Date Range */}
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <DateRangePicker
                  key={`${startDate?.toISOString()}-${endDate?.toISOString()}`}
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  placeholder="Select dates"
                  className="w-full"
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Listings Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No listings found</h2>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => handleListingClick(listing.id)}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-gray-200"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={getListingImage(listing)}
                    alt={listing.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Image count badge if multiple images */}
                  {listing.images && listing.images.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                      +{listing.images.length - 1}
                    </div>
                  )}
                  {/* Price badge */}
                  <div className="absolute bottom-3 left-3 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    ${listing.price}/mo
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {listing.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                    {listing.description}
                  </p>
                  
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {listing.city}, {listing.state}
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {formatDateRange(listing.availableFrom, listing.availableTo)}
                  </div>
                  
                  {/* Show some amenities if available */}
                  {listing.amenities && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      {(() => {
                        // Handle amenities that might be a string or array
                        let amenitiesArray = listing.amenities;
                        if (typeof listing.amenities === 'string') {
                          try {
                            amenitiesArray = JSON.parse(listing.amenities);
                          } catch {
                            amenitiesArray = [];
                          }
                        }
                        
                        if (!Array.isArray(amenitiesArray) || amenitiesArray.length === 0) {
                          return null;
                        }
                        
                        return (
                          <>
                            {amenitiesArray.slice(0, 2).map((amenity, index) => (
                              <span
                                key={index}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                              >
                                {amenity}
                              </span>
                            ))}
                            {amenitiesArray.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{amenitiesArray.length - 2} more
                              </span>
                            )}
                          </>
                        );
                      })()}
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

export default function ListingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListingsPageContent />
    </Suspense>
  );
} 