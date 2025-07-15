"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import DateRangePicker from '@/components/DateRangePicker';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
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

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search form state
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const hasPopulatedForm = useRef(false);

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
        const query = searchParams.get('q') || '';
        const location = searchParams.get('location') || '';
        const price = searchParams.get('price') || '';
        const availableFrom = searchParams.get('availableFrom') || '';
        const availableTo = searchParams.get('availableTo') || '';
        const duration = searchParams.get('duration') || '';
        const amenities = searchParams.get('amenities') || '';

        // Check if we have saved form state in localStorage
        const savedFormState = localStorage.getItem('listingsFormState');
        const hasUrlParams = query || location || price || duration || availableFrom || availableTo || amenities;
        
        if (savedFormState && hasUrlParams) {
          // Restore form state from localStorage when there are URL params
          const formState = JSON.parse(savedFormState);
          setSearchQuery(formState.searchQuery || '');
          setLocation(formState.location || '');
          setPriceMin(formState.priceMin || '');
          setPriceMax(formState.priceMax || '');
          if (formState.startDate) setStartDate(new Date(formState.startDate));
          if (formState.endDate) setEndDate(new Date(formState.endDate));
          setSelectedAmenities(formState.selectedAmenities || []);
        } else if (savedFormState && !hasUrlParams && !hasPopulatedForm.current) {
          // Restore form state from localStorage when no URL params (first load)
          const formState = JSON.parse(savedFormState);
          setSearchQuery(formState.searchQuery || '');
          setLocation(formState.location || '');
          setPriceMin(formState.priceMin || '');
          setPriceMax(formState.priceMax || '');
          if (formState.startDate) setStartDate(new Date(formState.startDate));
          if (formState.endDate) setEndDate(new Date(formState.endDate));
          setSelectedAmenities(formState.selectedAmenities || []);
          hasPopulatedForm.current = true;
        } else if (!hasPopulatedForm.current && hasUrlParams) {
          // Only populate from URL parameters if we haven't done it before
          hasPopulatedForm.current = true;
          setSearchQuery(query);
          setLocation(location); // Use the location parameter specifically
          
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
          } else if (availableFrom) {
            setStartDate(new Date(availableFrom));
          } else if (availableTo) {
            setEndDate(new Date(availableTo));
          }
          
          if (amenities) {
            setSelectedAmenities(amenities.split(','));
          }
        }

        if (query) params.append('q', query);
        if (location) params.append('location', location);
        if (price) params.append('price', price);
        if (availableFrom) params.append('availableFrom', availableFrom);
        if (availableTo) params.append('availableTo', availableTo);
        if (duration) params.append('duration', duration);
        if (amenities) params.append('amenities', amenities);

        console.log('API request URL:', `/api/listings?${params.toString()}`);
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

  // Save form state whenever form fields change
  useEffect(() => {
    if (searchQuery || location || priceMin || priceMax || startDate || endDate || selectedAmenities.length > 0) {
      saveFormState();
    }
  }, [searchQuery, location, priceMin, priceMax, startDate, endDate, selectedAmenities, saveFormState]);

  const saveFormState = () => {
    const formState = {
      searchQuery,
      location,
      priceMin,
      priceMax,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      selectedAmenities
    };
    localStorage.setItem('listingsFormState', JSON.stringify(formState));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    saveFormState(); // Save form state before navigation
    
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (location) params.append('location', location);
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

      {/* Search Bar */}
      <div className="bg-blue-800 border-b border-blue-700 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="bg-blue-700 rounded-lg p-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-4">
              {/* Search Query */}
              <div className="lg:col-span-4">
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-600 text-white placeholder-blue-300"
                />
              </div>
              
              {/* Location */}
              <div className="lg:col-span-3">
                <input
                  type="text"
                  placeholder="Location..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-600 text-white placeholder-blue-300"
                />
              </div>
              
              {/* Price Range */}
              <div className="lg:col-span-2 flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  min="0"
                  className="w-20 px-2 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-600 text-white placeholder-blue-300 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  min="0"
                  className="w-20 px-2 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-600 text-white placeholder-blue-300 text-sm"
                />
              </div>
              
              {/* Date Range */}
              <div className="lg:col-span-3">
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
            
            {/* Amenity Filters */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableAmenities.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="w-4 h-4 text-yellow-500 bg-blue-700 border-blue-600 rounded focus:ring-yellow-400 focus:ring-2"
                    />
                    <span className="text-blue-200 text-sm">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Search Button */}
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="px-8 py-3 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold text-lg"
              >
                Search Listings
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Listings Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-white mb-4">No listings found</h2>
            <p className="text-blue-200">Try adjusting your search criteria</p>
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
                      {formatDateRange(listing.availableFrom, listing.availableTo)}
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