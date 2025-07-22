"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  isThumbnail?: boolean;
}

interface ExistingImage {
  id: string;
  url: string;
  isThumbnail?: boolean;
}

export default function EditListingPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    state: '',
    price: '',
    bedrooms: '',
    property: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    availableFrom: '',
    availableTo: '',
    amenities: [] as string[]
  });
  
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();

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

  // Check authentication and ownership on component mount
  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  // Fetch listing data
  useEffect(() => {
    const fetchListing = async () => {
      if (!params.listingId || !user) return;
      
      setFetching(true);
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
        const listing = data.listing;
        
        // Check if current user is the owner
        const userResponse = await fetch(`/api/user?supabaseId=${user.id}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.user.id !== listing.userId) {
            setError('You can only edit your own listings');
            return;
          }
          setIsOwner(true);
        } else {
          setError('Failed to verify ownership');
          return;
        }
        
        // Populate form data
        setFormData({
          title: listing.title,
          description: listing.description,
          city: listing.city || '',
          state: listing.state || '',
          price: listing.price.toString(),
          bedrooms: listing.bedrooms ? listing.bedrooms.toString() : '',
          property: listing.property || '',
          contactName: listing.contactName,
          contactEmail: listing.contactEmail,
          contactPhone: listing.contactPhone,
          availableFrom: listing.availableFrom,
          availableTo: listing.availableTo,
          amenities: listing.amenities || []
        });
        
        // Set existing images
        if (listing.images && listing.images.length > 0) {
          const images = listing.images.map((url: string, index: number) => ({
            id: `existing-${index}`,
            url,
            isThumbnail: index === 0 // Assume first image is thumbnail
          }));
          setExistingImages(images);
        }
        
      } catch (error) {
        console.error('Error fetching listing:', error);
        setError('Failed to load listing');
      } finally {
        setFetching(false);
      }
    };

    if (user) {
      fetchListing();
    }
  }, [params.listingId, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage: UploadedImage = {
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            preview: e.target?.result as string
          };
          setUploadedImages(prev => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (id: string, isExisting: boolean = false) => {
    if (isExisting) {
      setExistingImages(prev => prev.filter(img => img.id !== id));
    } else {
      setUploadedImages(prev => prev.filter(img => img.id !== id));
    }
  };

  const setThumbnail = (id: string, isExisting: boolean = false) => {
    if (isExisting) {
      setExistingImages(prev => prev.map(img => ({
        ...img,
        isThumbnail: img.id === id
      })));
    } else {
      setUploadedImages(prev => prev.map(img => ({
        ...img,
        isThumbnail: img.id === id
      })));
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const imageUrls: string[] = [];
    
    // Add existing images that weren't removed
    for (const image of existingImages) {
      imageUrls.push(image.url);
    }
    
    // Upload new images
    for (const image of uploadedImages) {
      try {
        // Convert file to base64 for now (in production, you'd upload to a service like AWS S3)
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(image.file);
        });
        
        imageUrls.push(base64);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
    
    return imageUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('You must be logged in to edit a listing');
      }

      // Validate required fields
      if (!formData.title || !formData.description || !formData.price || 
          !formData.contactName ||
          !formData.contactEmail || !formData.contactPhone || !formData.availableFrom || !formData.availableTo) {
        throw new Error('Please fill in all required fields');
      }

      // Validate date range
      if (new Date(formData.availableFrom) >= new Date(formData.availableTo)) {
        throw new Error('Available To date must be after Available From date');
      }

      // Validate that at least one image remains
      if (existingImages.length === 0 && uploadedImages.length === 0) {
        throw new Error('Please keep at least one photo');
      }

      // Check if thumbnail is selected
      const hasThumbnail = existingImages.some(img => img.isThumbnail) || uploadedImages.some(img => img.isThumbnail);
      if (!hasThumbnail) {
        throw new Error('Please select a thumbnail image by clicking on one of the photos');
      }

      // Upload images and get thumbnail
      const imageUrls = await uploadImages();
      const thumbnailIndex = [...existingImages, ...uploadedImages].findIndex(img => img.isThumbnail);
      const thumbnailUrl = imageUrls[thumbnailIndex];

      // Update listing data
      const listingData = {
        ...formData,
        city: formData.city.toLowerCase(),
        state: formData.state.toLowerCase(),
        price: parseInt(formData.price),
        images: imageUrls,
        imageUrl: thumbnailUrl,
        supabaseId: currentUser.id
      };

      console.log('Sending update request:', {
        url: `/api/listings/${params.listingId}`,
        data: listingData
      });

      const response = await fetch(`/api/listings/${params.listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listingData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to update listing');
      }

      setSuccess('Listing updated successfully!');
      setTimeout(() => {
        router.push(`/listings/${params.listingId}`);
      }, 2000);

    } catch (error) {
      console.error('Error updating listing:', error);
      setError(error instanceof Error ? error.message : 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading listing...</div>
      </div>
    );
  }

  if (error && !isOwner) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-4">{error}</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
          >
            Back to Dashboard
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

            {/* Page Title */}
            <h1 className="text-xl font-semibold text-white">Edit Listing</h1>

            {/* Back Button */}
            <button
              onClick={() => router.push(`/listings/${params.listingId}`)}
              className="px-4 py-2 text-blue-200 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-800 rounded-lg shadow-lg p-8 border border-blue-700">
          <h2 className="text-2xl font-bold text-white mb-6">Edit Your Listing</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-600 text-white rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-600 text-white rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-blue-200 font-medium mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300"
                  placeholder="Enter listing title"
                  required
                />
              </div>
              <div>
                <label className="block text-blue-200 font-medium mb-2">
                  Price (per month) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300"
                  placeholder="Enter monthly rent"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-blue-200 font-medium mb-2">
                  Bedrooms *
                </label>
                <select
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white"
                  required
                >
                  <option value="">Select bedrooms</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4 Bedrooms</option>
                  <option value="5">5 Bedrooms</option>
                  <option value="6">6+ Bedrooms</option>
                </select>
              </div>
              <div>
                <label className="block text-blue-200 font-medium mb-2">
                  Housing Type *
                </label>
                <select
                  name="property"
                  value={formData.property}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white"
                  required
                >
                  <option value="">Select type</option>
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
            </div>

            <div>
              <label className="block text-blue-200 font-medium mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300"
                placeholder="City"
                required
              />
            </div>
            <div>
              <label className="block text-blue-200 font-medium mb-2">
                State *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300"
                placeholder="State"
                required
              />
            </div>

            <div>
              <label className="block text-blue-200 font-medium mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300"
                placeholder="Describe your listing..."
                required
              />
            </div>

            {/* Availability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-blue-200 font-medium mb-2">
                  Available From *
                </label>
                <input
                  type="date"
                  name="availableFrom"
                  value={formData.availableFrom}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-blue-200 font-medium mb-2">
                  Available To *
                </label>
                <input
                  type="date"
                  name="availableTo"
                  value={formData.availableTo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white"
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-blue-200 font-medium mb-2">
                  Contact Name *
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300"
                  placeholder="Your name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-blue-200 font-medium mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-blue-200 font-medium mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-blue-200 font-medium mb-4">
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableAmenities.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="w-4 h-4 text-yellow-500 bg-blue-700 border-blue-600 rounded focus:ring-yellow-400 focus:ring-2"
                    />
                    <span className="text-blue-200 text-sm">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-blue-200 font-medium mb-4">
                Photos
              </label>
              
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Current Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className={`relative h-32 rounded-lg overflow-hidden border-2 transition-all ${
                          image.isThumbnail 
                            ? 'border-yellow-400' 
                            : 'border-transparent hover:border-blue-400'
                        }`}>
                          <Image
                            src={image.url}
                            alt="Listing image"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setThumbnail(image.id, true)}
                                className="p-1 bg-yellow-500 text-blue-900 rounded hover:bg-yellow-400 transition"
                                title="Set as thumbnail"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => removeImage(image.id, true)}
                                className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                title="Remove image"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        {image.isThumbnail && (
                          <div className="absolute top-2 left-2 bg-yellow-500 text-blue-900 px-2 py-1 rounded text-xs font-semibold">
                            Thumbnail
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Image Upload */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Add New Photos</h3>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-yellow-400 bg-yellow-400/10' 
                      : 'border-blue-600 hover:border-blue-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <div className="space-y-4">
                    <svg className="mx-auto h-12 w-12 text-blue-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
                      >
                        Choose Files
                      </button>
                      <p className="mt-2 text-blue-300">or drag and drop</p>
                    </div>
                    <p className="text-sm text-blue-400">
                      PNG, JPG, GIF up to 10MB each
                    </p>
                  </div>
                </div>
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">New Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className={`relative h-32 rounded-lg overflow-hidden border-2 transition-all ${
                          image.isThumbnail 
                            ? 'border-yellow-400' 
                            : 'border-transparent hover:border-blue-400'
                        }`}>
                          <Image
                            src={image.preview}
                            alt="Uploaded image"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setThumbnail(image.id)}
                                className="p-1 bg-yellow-500 text-blue-900 rounded hover:bg-yellow-400 transition"
                                title="Set as thumbnail"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => removeImage(image.id)}
                                className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                title="Remove image"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        {image.isThumbnail && (
                          <div className="absolute top-2 left-2 bg-yellow-500 text-blue-900 px-2 py-1 rounded text-xs font-semibold">
                            Thumbnail
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push(`/listings/${params.listingId}`)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Listing'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 