"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import DateRangePicker from '@/components/DateRangePicker';
import CityStateAutocomplete from '@/components/CityStateAutocomplete';
import LoadingSpinner from '@/components/LoadingSpinner';
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
  property?: string;
  bedrooms?: number;
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
  
  // Add state for property and bedrooms
  const [property, setProperty] = useState('');
  const [bedrooms, setBedrooms] = useState('');

  // Available amenities options
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
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Memoize the search parameters to prevent unnecessary API calls
  const memoizedSearchParams = useMemo(() => {
    return {
      city: searchParams.get('city') || '',
      state: searchParams.get('state') || '',
      price: searchParams.get('price') || '',
      duration: searchParams.get('duration') || '',
      amenities: searchParams.get('amenities') || '',
      property: searchParams.get('property') || '',
      bedrooms: searchParams.get('bedrooms') || ''
    };
  }, [searchParams]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const params = new URLSearchParams();
        const { city: cityParam, state: stateParam, price, duration, amenities, property: propertyParam, bedrooms: bedroomsParam } = memoizedSearchParams;

        // Check if there are any URL parameters
        const hasUrlParams = cityParam || stateParam || price || duration || amenities || propertyParam || bedroomsParam;
        
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
          setProperty(propertyParam || '');
          setBedrooms(bedroomsParam || '');
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
          setProperty('');
          setBedrooms('');
        }

        if (cityParam) params.append('city', cityParam);
        if (stateParam) params.append('state', stateParam);
        if (price) params.append('price', price);
        if (duration) params.append('duration', duration);
        if (amenities) params.append('amenities', amenities);
        if (propertyParam) params.append('property', propertyParam);
        if (bedroomsParam) params.append('bedrooms', bedroomsParam);
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        console.log('API request URL:', `/api/listings?${params.toString()}`);
        const response = await fetch(`/api/listings?${params.toString()}`);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API response data:', data);
          setFilteredListings(data.listings || []);
          setTotalCount(data.totalCount || 0);
        } else {
          const errorData = await response.text();
          console.error('Failed to fetch listings. Status:', response.status);
          console.error('Error response:', errorData);
          // API failed, show empty state
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
  }, [memoizedSearchParams, page, limit]);

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
    if (property) params.append('property', property);
    if (bedrooms) params.append('bedrooms', bedrooms);
    
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

  // Pagination controls
  const totalPages = Math.ceil(totalCount / limit);
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Utility function to title-case a string
  function toTitleCase(str: string) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  // Helper to ensure amenities is always an array
  function getAmenitiesArray(amenities: unknown): string[] {
    if (Array.isArray(amenities)) return amenities;
    if (typeof amenities === 'string') {
      try {
        const arr = JSON.parse(amenities);
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <div className="text-xl text-white mt-4">Loading listings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900">
      {/* Navigation Bar */}
      <nav className="bg-blue-800 shadow-sm border-b border-blue-800">
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
              <h1 className="text-lg font-medium text-white">
                {filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'} found
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/create-listing')}
                className="px-6 py-2 bg-yellow-400 hover:bg-yellow-300 text-blue-900 rounded-lg transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                Create Listing
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Bar */}
      <div className="bg-blue-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="bg-blue-800 rounded-lg p-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-4">
              {/* City and State with Autocomplete */}
              <div className="lg:col-span-4">
                <CityStateAutocomplete
                  onCitySelect={(selectedCity, selectedState) => {
                    setCity(selectedCity);
                    setState(selectedState);
                  }}
                  initialCity={city}
                  initialState={state}
                  className="w-full"
                />
              </div>
              
              {/* Property Type Dropdown */}
              <div className="lg:col-span-2">
                <select
                  value={property}
                  onChange={e => setProperty(e.target.value)}
                  className="w-full px-2 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white text-sm"
                >
                  <option value="">All Housing Types</option>
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Studio">Studio</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Condo">Condo</option>
                  <option value="Duplex">Duplex</option>
                  <option value="Loft">Loft</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {/* Bedrooms Dropdown */}
              <div className="lg:col-span-2">
                <select
                  value={bedrooms}
                  onChange={e => setBedrooms(e.target.value)}
                  className="w-full px-2 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white text-sm"
                >
                  <option value="">Any Bedrooms</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4 Bedrooms</option>
                  <option value="5">5 Bedrooms</option>
                  <option value="6">6+ Bedrooms</option>
                </select>
              </div>
              
              {/* Price Range */}
              <div className="lg:col-span-2 flex gap-2">
                <input
                  type="number"
                  placeholder="Min $"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  min="0"
                  className="w-20 px-2 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max $"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  min="0"
                  className="w-20 px-2 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300 text-sm"
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
                    <span className="text-blue-100 text-sm">{amenity}</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mb-8 gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-blue-700 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-white">Page {page} of {totalPages}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-blue-700 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
        {filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-blue-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">No listings found</h2>
            <p className="text-blue-200">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => handleListingClick(listing.id)}
                className="group bg-blue-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-blue-700 hover:border-blue-500"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={getListingImage(listing)}
                    alt={listing.title}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                  {/* Image count badge if multiple images */}
                  {listing.images && listing.images.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                      +{listing.images.length - 1}
                    </div>
                  )}
                  {/* Price badge */}
                  <div className="absolute bottom-3 left-3 bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    ${listing.price}/mo
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1 group-hover:text-yellow-400 transition-colors">
                    {listing.title}
                  </h3>
                  <p className="text-blue-100 mb-4 line-clamp-2 text-sm">
                    {listing.description}
                  </p>

                  {/* Property and Bedrooms */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="text-xs bg-blue-700 text-blue-100 px-2 py-1 rounded-full">
                       {listing.property || 'N/A'}
                    </span>
                    <span className="text-xs bg-blue-700 text-blue-100 px-2 py-1 rounded-full">
                       {listing.bedrooms !== undefined ? listing.bedrooms : 'N/A'} Bedroom{listing.bedrooms === 1 ? '' : 's'}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-blue-200 text-sm mb-3">
                    {toTitleCase(listing.city)}, {listing.state.toUpperCase()}
                  </div>
                  
                  {/* Address */}
                  <div className="flex items-center text-blue-200 text-sm mb-3">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.418 0-8-5.373-8-10A8 8 0 1 1 20 11c0 4.627-3.582 10-8 10z" />
                      <circle cx="12" cy="11" r="3" fill="currentColor" />
                    </svg>
                    {listing.address ? listing.address : 'Address not provided'}
                  </div>
                  
                  <div className="flex items-center text-blue-200 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {formatDateRange(listing.availableFrom, listing.availableTo)}
                  </div>
                  
                  {/* Show some amenities if available */}
                  {(() => {
                    const amenitiesArray = getAmenitiesArray(listing.amenities);
                    if (!Array.isArray(amenitiesArray) || amenitiesArray.length === 0) {
                      return null;
                    }
                    
                    return (
                      <>
                        {amenitiesArray.slice(0, 2).map((amenity, index) => (
                          <span
                            key={index}
                            className="text-xs bg-blue-700 text-blue-100 px-2 py-1 rounded-full"
                          >
                            {amenity}
                          </span>
                        ))}
                        {amenitiesArray.length > 2 && (
                          <span className="text-xs text-blue-300">
                            +{amenitiesArray.length - 2} more
                          </span>
                        )}
                      </>
                    );
                  })()}
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