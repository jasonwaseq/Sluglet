"use client";

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import DateRangePicker from '@/components/DateRangePicker';
import CityStateAutocomplete from '@/components/CityStateAutocomplete';
import { useAuth } from '@/components/AuthProvider';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  // Search form state (match listings page)
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [property, setProperty] = useState('');
  const [bedrooms, setBedrooms] = useState('');

  // Available amenities options (match listings page)
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

  // Restore search state from URL on mount (match listings page)
  useEffect(() => {
    function parseDateString(dateStr: string): Date | null {
      // Expects 'YYYY-MM-DD'
      const parts = dateStr.split('-');
      if (parts.length !== 3) return null;
      const [year, month, day] = parts.map(Number);
      if (!year || !month || !day) return null;
      // month is 0-based in JS Date
      return new Date(year, month - 1, day);
    }

    const cityParam = searchParams.get('city') || '';
    const stateParam = searchParams.get('state') || '';
    const price = searchParams.get('price') || '';
    const duration = searchParams.get('duration') || '';
    const amenities = searchParams.get('amenities') || '';
    const propertyParam = searchParams.get('property') || '';
    const bedroomsParam = searchParams.get('bedrooms') || '';

    setCity(cityParam);
    setState(stateParam);
    setProperty(propertyParam);
    setBedrooms(bedroomsParam);

    if (price) {
      const [min, max] = price.split('-').map(p => p === '+' ? '' : p);
      setPriceMin(min || '');
      setPriceMax(max || '');
    }

    if (duration) {
      // Expecting 'YYYY-MM-DD-YYYY-MM-DD' or 'YYYY-MM-DD' (single day)
      const parts = duration.split('-');
      if (parts.length === 6) {
        const start = `${parts[0]}-${parts[1]}-${parts[2]}`;
        const end = `${parts[3]}-${parts[4]}-${parts[5]}`;
        setStartDate(parseDateString(start));
        setEndDate(parseDateString(end));
      } else if (parts.length === 2) {
        // fallback: treat as two dates
        setStartDate(parseDateString(parts[0]));
        setEndDate(parseDateString(parts[1]));
      } else if (parts.length === 3) {
        // fallback: treat as single date
        setStartDate(parseDateString(duration));
        setEndDate(parseDateString(duration));
      }
    }

    if (amenities) {
      setSelectedAmenities(amenities.split(','));
    }
  }, [searchParams]);

  // Search handler (match listings page)
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

  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const { user, signOut } = useAuth();

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/user/profile?supabaseId=${user.id}`);
          if (response.ok) {
            const profileData = await response.json();
            setProfilePicture(profileData.profilePicture);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth');
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
            {/* Right Side Actions (profile, sign out, etc.) */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
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
                    className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-400 transition overflow-hidden"
                    title="Profile"
                  >
                    {profilePicture ? (
                      <Image
                        src={profilePicture}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                  {/* Sign Out */}
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-blue-200 hover:text-white transition"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  {/* Login/Sign Up Button */}
                  <button
                    onClick={() => router.push('/auth')}
                    className="px-4 py-2 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
                  >
                    Log In / Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Search Bar (identical to listings) */}
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
      
      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => router.push('/listings')}
          className="px-6 py-3 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
        >
          Browse All Listings
        </button>
        {user ? (
          <button
            onClick={() => router.push('/create-listing')}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
          >
            Create New Listing
          </button>
        ) : (
          <button
            onClick={() => router.push('/auth')}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
          >
            Login to Create Listing
          </button>
        )}
      </div>
    </div>
  );
} 