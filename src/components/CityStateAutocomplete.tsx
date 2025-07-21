'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface CityStateAutocompleteProps {
  onCitySelect: (city: string, state: string) => void;
  initialCity?: string;
  initialState?: string;
  className?: string;
}

export default function CityStateAutocomplete({
  onCitySelect,
  initialCity = '',
  initialState = '',
  className = ''
}: CityStateAutocompleteProps) {
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const stateInputRef = useRef<HTMLInputElement>(null);
  const cityAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const stateAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Sync local state with props when they change
  useEffect(() => {
    setCity(initialCity);
    setState(initialState);
  }, [initialCity, initialState]);

  // Initialize Google Maps API
  useEffect(() => {
    const initApi = async () => {
      if (isApiLoaded) return;
      
      setIsLoading(true);
      console.log('Initializing Google Maps API...');
      
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        console.log('Google Maps API loaded successfully');
        setIsApiLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && !isApiLoaded) {
      initApi();
    }
  }, [isApiLoaded]);

  // Initialize autocomplete after API is loaded
  useEffect(() => {
    if (!isApiLoaded || !window.google) return;

    console.log('Initializing autocomplete components...');
    
    // Initialize city autocomplete
    if (cityInputRef.current && !cityAutocompleteRef.current) {
      try {
        cityAutocompleteRef.current = new window.google.maps.places.Autocomplete(
          cityInputRef.current,
          {
            types: ['(cities)'],
            componentRestrictions: { country: 'us' }
          }
        );

        cityAutocompleteRef.current.addListener('place_changed', () => {
          const place = cityAutocompleteRef.current?.getPlace();
          console.log('City place selected:', place);
          
          if (place && place.address_components) {
            let cityName = '';
            let stateName = '';

            for (const component of place.address_components) {
              const types = component.types;
              if (types.includes('locality')) {
                cityName = component.long_name;
              }
              if (types.includes('administrative_area_level_1')) {
                stateName = component.short_name;
              }
            }

            console.log('Extracted city:', cityName, 'state:', stateName);

            if (cityName) {
              setCity(cityName);
              setState(stateName);
              onCitySelect(cityName, stateName);
            }
          }
        });
        console.log('City autocomplete initialized');
      } catch (error) {
        console.error('Error initializing city autocomplete:', error);
      }
    }

    // Initialize state autocomplete
    if (stateInputRef.current && !stateAutocompleteRef.current) {
      try {
        stateAutocompleteRef.current = new window.google.maps.places.Autocomplete(
          stateInputRef.current,
          {
            types: ['administrative_area_level_1'],
            componentRestrictions: { country: 'us' }
          }
        );

        stateAutocompleteRef.current.addListener('place_changed', () => {
          const place = stateAutocompleteRef.current?.getPlace();
          console.log('State place selected:', place);
          
          if (place && place.address_components) {
            let stateName = '';

            for (const component of place.address_components) {
              const types = component.types;
              if (types.includes('administrative_area_level_1')) {
                stateName = component.short_name;
                break;
              }
            }

            console.log('Extracted state:', stateName);

            if (stateName) {
              setState(stateName);
              onCitySelect(city, stateName);
            }
          }
        });
        console.log('State autocomplete initialized');
      } catch (error) {
        console.error('Error initializing state autocomplete:', error);
      }
    }
  }, [isApiLoaded, onCitySelect, city]);

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCity(e.target.value);
    onCitySelect(e.target.value, state);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(e.target.value);
    onCitySelect(city, e.target.value);
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* City with Autocomplete */}
      <div>
        <input
          ref={cityInputRef}
          type="text"
          placeholder="City..."
          value={city}
          onChange={handleCityChange}
          className="w-full px-4 py-3 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-text placeholder-muted"
          disabled={isLoading}
        />
        {isLoading && <div className="text-xs text-gray-500 mt-1">Loading autocomplete...</div>}
      </div>
      
      {/* State with Autocomplete */}
      <div>
        <input
          ref={stateInputRef}
          type="text"
          placeholder="State..."
          value={state}
          onChange={handleStateChange}
          className="w-full px-4 py-3 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-text placeholder-muted"
          disabled={isLoading}
        />
        {isLoading && <div className="text-xs text-gray-500 mt-1">Loading autocomplete...</div>}
      </div>
    </div>
  );
} 