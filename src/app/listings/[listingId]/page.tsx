"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

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
    profilePicture?: string;
    description?: string;
  };
}

export default function ListingDetailPage() {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (!supabase) {
      return;
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchListing = async () => {
      if (!params.listingId) return;
      
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch(`/api/listings/${params.listingId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Listing not found');
          } else {
            setError('Failed to load listing');
          }
          return;
        }
        
        const data = await response.json();
        setListing(data.listing);
        
        // Check if current user is the owner of the listing
        if (user && data.listing.user) {
          const userResponse = await fetch(`/api/user?supabaseId=${user.id}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setIsOwner(userData.user.id === data.listing.userId);
          }
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
        setError('Failed to load listing');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [params.listingId, user]);

  const formatDateRange = (from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    const fromFormatted = fromDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    const toFormatted = toDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    
    return `${fromFormatted} - ${toFormatted}`;
  };

  const getListingImages = useCallback(() => {
    if (!listing) return [];
    if (listing.images && listing.images.length > 0) {
      return listing.images;
    }
    if (listing.imageUrl) {
      return [listing.imageUrl];
    }
    // Default placeholder image
    return ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"];
  }, [listing]);

  const nextImage = useCallback(() => {
    const images = getListingImages();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [getListingImages]);

  const prevImage = useCallback(() => {
    const images = getListingImages();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [getListingImages]);

  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isFullscreen) return;
    
    if (event.key === 'Escape') {
      closeFullscreen();
    } else if (event.key === 'ArrowLeft') {
      prevImage();
    } else if (event.key === 'ArrowRight') {
      nextImage();
    }
  }, [isFullscreen, prevImage, nextImage, closeFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen, handleKeyDown]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading listing...</div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-4">
            {error || 'Listing not found'}
          </h1>
          <button
            onClick={() => router.push('/listings')}
            className="px-6 py-3 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
          >
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  const images = getListingImages();

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

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              {isOwner && (
                <button
                  onClick={() => router.push(`/edit-listing/${params.listingId}`)}
                  className="px-4 py-2 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
                >
                  Edit Listing
                </button>
              )}
              <button
                onClick={() => router.push('/listings')}
                className="px-4 py-2 text-blue-200 hover:text-white transition"
              >
                ← Back to Listings
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Listing Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-800 rounded-lg shadow-lg overflow-hidden border border-blue-700">
          {/* Image Gallery */}
          <div className="relative h-96 md:h-[500px] bg-blue-900">
            <Image
              src={images[currentImageIndex]}
              alt={listing.title}
              fill
              className="object-contain cursor-pointer"
              onClick={openFullscreen}
            />
            
            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={openFullscreen}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
              title="View fullscreen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="p-4 bg-blue-700 border-b border-blue-600">
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-yellow-400' 
                        : 'border-transparent hover:border-blue-400'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${listing.title} - Image ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {listing.title}
                </h1>
                <p className="text-lg text-blue-200 mb-2">
                  📍 {listing.location}
                </p>
                <p className="text-blue-300">
                  Listed by {listing.contactName}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-yellow-400">
                  ${listing.price}/month
                </div>
                <div className="text-blue-300">
                  {formatDateRange(listing.availableFrom, listing.availableTo)}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Description</h2>
              <p className="text-blue-200 leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Amenities</h3>
                {listing.amenities && listing.amenities.length > 0 ? (
                  <ul className="space-y-2">
                    {listing.amenities.map((amenity: string, index: number) => (
                      <li key={index} className="flex items-center text-blue-200">
                        <span className="text-yellow-400 mr-2">✓</span>
                        {amenity}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-blue-300">No amenities listed</p>
                )}
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-blue-200">Name:</span>
                    <p className="text-blue-300">{listing.contactName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-200">Email:</span>
                    <p className="text-blue-300">{listing.contactEmail}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-200">Phone:</span>
                    <p className="text-blue-300">{listing.contactPhone}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-200">Available:</span>
                    <p className="text-blue-300">{formatDateRange(listing.availableFrom, listing.availableTo)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-700 p-4 rounded-lg">
                  <span className="font-medium text-blue-200">Monthly Rent</span>
                  <p className="text-2xl font-bold text-yellow-400">${listing.price}</p>
                </div>
                <div className="bg-blue-700 p-4 rounded-lg">
                  <span className="font-medium text-blue-200">Location</span>
                  <p className="text-blue-300">{listing.location}</p>
                </div>
                <div className="bg-blue-700 p-4 rounded-lg">
                  <span className="font-medium text-blue-200">Listed</span>
                  <p className="text-blue-300">
                    {new Date(listing.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>


          </div>
        </div>
      </main>

      {/* Fullscreen Image Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Main Image */}
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <Image
                src={images[currentImageIndex]}
                alt={listing.title}
                fill
                className="object-contain"
              />
            </div>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-lg">
              {currentImageIndex + 1} / {images.length}
            </div>

            {/* Instructions */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              Use arrow keys or click to navigate • ESC to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 