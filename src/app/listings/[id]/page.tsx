"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

// Mock data - replace with real API calls
const mockListings = [
  {
    id: 1,
    title: "Cozy Studio in Downtown",
    price: 1200,
    duration: "6 months",
    location: "Downtown",
    description: "Beautiful studio apartment with great amenities. This fully furnished studio is perfect for students or young professionals. Features include hardwood floors, modern appliances, and a private balcony with city views.",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    amenities: ["Furnished", "WiFi", "Utilities Included", "Parking", "Gym Access"],
    contactInfo: {
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "(555) 123-4567"
    },
    availableFrom: "September 1, 2024"
  },
  {
    id: 2,
    title: "2BR Apartment Near Campus",
    price: 800,
    duration: "3 months",
    location: "University District",
    description: "Perfect for students, fully furnished 2-bedroom apartment within walking distance to campus. Quiet neighborhood with easy access to public transportation.",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    amenities: ["Furnished", "WiFi", "Utilities Included", "Laundry", "Study Room"],
    contactInfo: {
      name: "Mike Chen",
      email: "mike.chen@email.com",
      phone: "(555) 987-6543"
    },
    availableFrom: "August 15, 2024"
  },
  {
    id: 3,
    title: "Luxury 1BR with City View",
    price: 1500,
    duration: "12 months",
    location: "Midtown",
    description: "High-end apartment with amazing city views. This luxury 1-bedroom apartment features premium finishes, floor-to-ceiling windows, and access to building amenities including a rooftop terrace and fitness center.",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    amenities: ["Furnished", "WiFi", "Utilities Included", "Rooftop Terrace", "Fitness Center", "Concierge"],
    contactInfo: {
      name: "Emily Rodriguez",
      email: "emily.rodriguez@email.com",
      phone: "(555) 456-7890"
    },
    availableFrom: "October 1, 2024"
  }
];

export default function ListingDetailPage() {
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Simulate API call
    const fetchListing = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const listingId = parseInt(params.id as string);
      const foundListing = mockListings.find(l => l.id === listingId);
      
      if (foundListing) {
        setListing(foundListing);
      }
      setLoading(false);
    };

    fetchListing();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-4">Listing not found</h1>
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

            {/* Back to Listings */}
            <button
              onClick={() => router.push('/listings')}
              className="px-4 py-2 text-blue-200 hover:text-white transition"
            >
              ← Back to Listings
            </button>
          </div>
        </div>
      </nav>

      {/* Listing Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-800 rounded-lg shadow-lg overflow-hidden border border-blue-700">
          {/* Image */}
          <div className="relative h-96">
            <Image
              src={listing.image}
              alt={listing.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {listing.title}
                </h1>
                <p className="text-lg text-blue-200">
                  📍 {listing.location}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-yellow-400">
                  ${listing.price}/month
                </div>
                <div className="text-blue-300">
                  {listing.duration}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Amenities</h3>
                <ul className="space-y-2">
                  {listing.amenities.map((amenity: string, index: number) => (
                    <li key={index} className="flex items-center text-blue-200">
                      <span className="text-yellow-400 mr-2">✓</span>
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-blue-200">Name:</span>
                    <p className="text-blue-300">{listing.contactInfo.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-200">Email:</span>
                    <p className="text-blue-300">{listing.contactInfo.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-200">Phone:</span>
                    <p className="text-blue-300">{listing.contactInfo.phone}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-200">Available From:</span>
                    <p className="text-blue-300">{listing.availableFrom}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button className="flex-1 bg-yellow-500 text-blue-900 py-3 px-6 rounded-lg hover:bg-yellow-400 transition font-semibold">
                Contact Owner
              </button>
              <button className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition font-semibold">
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 