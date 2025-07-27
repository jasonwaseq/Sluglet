'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface AddressAutocompleteProps {
  onAddressSelect: (address: string, city: string, state: string, lat?: number, lng?: number) => void;
  initialAddress?: string;
  initialCity?: string;
  initialState?: string;
  className?: string;
}

export default function AddressAutocomplete({
  onAddressSelect,
  initialAddress = '',
  initialCity = '',
  initialState = '',
  className = ''
}: AddressAutocompleteProps) {
  const [address, setAddress] = useState(initialAddress);
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const initAutocomplete = async () => {
      setIsLoading(true);
      console.log('Initializing Google Maps Autocomplete...');
      console.log('API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');
      
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
          version: 'weekly',
          libraries: ['places']
        });

        console.log('Loading Google Maps API...');
        await loader.load();
        console.log('Google Maps API loaded successfully');
        
        if (addressInputRef.current && window.google) {
          console.log('Creating Autocomplete instance...');
          autocompleteRef.current = new window.google.maps.places.Autocomplete(
            addressInputRef.current,
            {
              types: ['address'],
              componentRestrictions: { country: 'us' }
            }
          );

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();
            console.log('Place selected:', place);
            if (place && place.formatted_address) {
              console.log('Formatted address:', place.formatted_address);
              console.log('Address components:', place.address_components);
              const addressComponents = place.address_components;
              let streetAddress = '';
              let cityName = '';
              let stateName = '';

              // Extract address components
              if (addressComponents) {
                for (const component of addressComponents) {
                  const types = component.types;

                  if (types.includes('street_number') || types.includes('route')) {
                    streetAddress += component.long_name + ' ';
                  }
                  if (types.includes('locality')) {
                    cityName = component.long_name;
                  }
                  if (types.includes('administrative_area_level_1')) {
                    stateName = component.short_name;
                  }
                }
              }

              // Clean up street address
              streetAddress = streetAddress.trim();

              // Update state
              setAddress(streetAddress);
              setCity(cityName);
              setState(stateName);
              setLatitude(place.geometry?.location?.lat());
              setLongitude(place.geometry?.location?.lng());

              // Call the callback with extracted data
              onAddressSelect(
                streetAddress,
                cityName,
                stateName,
                place.geometry?.location?.lat(),
                place.geometry?.location?.lng()
              );
            }
          });
        }
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.log('API key found, initializing autocomplete...');
      initAutocomplete();
    } else {
      console.error('Google Maps API key is missing!');
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));
    }
  }, [onAddressSelect]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCity(e.target.value);
    // Preserve existing coordinates when manually editing
    onAddressSelect(address, e.target.value, state, latitude, longitude);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(e.target.value);
    // Preserve existing coordinates when manually editing
    onAddressSelect(address, city, e.target.value, latitude, longitude);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Street Address with Autocomplete */}
      <div>
        <label className="block text-blue-200 mb-2">Street Address *</label>
        <input
          ref={addressInputRef}
          type="text"
          placeholder="Enter street address..."
          value={address}
          onChange={handleAddressChange}
          className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300"
          disabled={isLoading}
        />
        {isLoading && (
          <p className="text-sm text-blue-300 mt-1">Loading address suggestions...</p>
        )}
      </div>

      {/* City and State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-blue-200 mb-2">City *</label>
          <input
            type="text"
            placeholder="City..."
            value={city}
            onChange={handleCityChange}
            className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300"
          />
        </div>
        <div>
          <label className="block text-blue-200 mb-2">State *</label>
          <input
            type="text"
            placeholder="State..."
            value={state}
            onChange={handleStateChange}
            className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300"
          />
        </div>
      </div>
    </div>
  );
} 