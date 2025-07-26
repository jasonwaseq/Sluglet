import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Listing {
  id: string;
  title: string;
  description: string;
  address?: string | null;
  city: string;
  state: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  amenities: string[];
  availableFrom: string;
  availableTo: string;
  property?: string;
  bedrooms?: number;
}

interface VirtualizedListingsProps {
  listings: Listing[];
  itemHeight?: number;
  containerHeight?: number;
}

export default function VirtualizedListings({ 
  listings, 
  itemHeight = 400, 
  containerHeight = 800 
}: VirtualizedListingsProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const handleListingClick = (listingId: string) => {
    router.push(`/listings/${listingId}`);
  };

  const getListingImage = (listing: Listing) => {
    if (listing.images && listing.images.length > 0) {
      return listing.images[0];
    }
    if (listing.imageUrl) {
      return listing.imageUrl;
    }
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

  function toTitleCase(str: string) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

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

  // Calculate visible range
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, listings.length);

  // Get visible items
  const visibleItems = listings.slice(startIndex, endIndex);

  const totalHeight = listings.length * itemHeight;

  return (
    <div 
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
      className="bg-blue-900"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
          {visibleItems.map((listing, index) => (
            <div
              key={listing.id}
              style={{ height: itemHeight }}
              className="mb-8"
            >
              <div
                onClick={() => handleListingClick(listing.id)}
                className="group bg-blue-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-blue-700 hover:border-blue-500 h-full"
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
                  {listing.images && listing.images.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                      +{listing.images.length - 1}
                    </div>
                  )}
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 