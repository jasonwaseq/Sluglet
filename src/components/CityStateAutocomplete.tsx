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
  const cityInputRef = useRef<HTMLInputElement>(null);
  const stateInputRef = useRef<HTMLInputElement>(null);
  const cityAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const stateAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const initAutocomplete = async () => {
      setIsLoading(true);
      console.log('Initializing City/State Autocomplete...');
      
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        console.log('Google Maps API loaded for city/state autocomplete');
        
        // Initialize city autocomplete
        if (cityInputRef.current && window.google) {
          cityAutocompleteRef.current = new window.google.maps.places.Autocomplete(
            cityInputRef.current,
            {
              types: ['(cities)'],
              componentRestrictions: { country: 'us' }
            }
          );

          cityAutocompleteRef.current.addListener('place_changed', () => {
            const place = cityAutocompleteRef.current?.getPlace();
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

              if (cityName) {
                setCity(cityName);
                setState(stateName);
                onCitySelect(cityName, stateName);
              }
            }
          });
        }

        // Initialize state autocomplete (for when user types in state field)
        if (stateInputRef.current && window.google) {
          stateAutocompleteRef.current = new window.google.maps.places.Autocomplete(
            stateInputRef.current,
            {
              types: ['administrative_area_level_1'],
              componentRestrictions: { country: 'us' }
            }
          );

          stateAutocompleteRef.current.addListener('place_changed', () => {
            const place = stateAutocompleteRef.current?.getPlace();
            if (place && place.address_components) {
              let stateName = '';

              for (const component of place.address_components) {
                const types = component.types;
                if (types.includes('administrative_area_level_1')) {
                  stateName = component.short_name;
                  break;
                }
              }

              if (stateName) {
                setState(stateName);
                onCitySelect(city, stateName);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error loading Google Maps API for city/state autocomplete:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      initAutocomplete();
    }
  }, [onCitySelect, city]);

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
      </div>
    </div>
  );
} 