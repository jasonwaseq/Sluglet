import { NextRequest, NextResponse } from 'next/server';

// Mock data for testing
const mockListings = [
  {
    id: '1',
    title: 'Cozy Studio in Downtown',
    description: 'Beautiful studio apartment in the heart of downtown',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    latitude: 37.7749,
    longitude: -122.4194,
    price: 2500,
    imageUrl: null,
    images: null,
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Laundry']),
    contactName: 'John Doe',
    contactEmail: 'john@example.com',
    contactPhone: '555-1234',
    availableFrom: '2024-09-01',
    availableTo: '2024-12-31',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'user1',
    user: {
      id: 'user1',
      supabaseId: 'supabase-user-1',
      email: 'john@example.com',
      profilePicture: null,
      description: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  {
    id: '2',
    title: 'Modern 2BR Apartment',
    description: 'Spacious 2-bedroom apartment with great amenities',
    address: '456 Oak Ave',
    city: 'Los Angeles',
    state: 'CA',
    latitude: 34.0522,
    longitude: -118.2437,
    price: 3200,
    imageUrl: null,
    images: null,
    amenities: JSON.stringify(['Pool', 'Gym', 'Parking']),
    contactName: 'Jane Smith',
    contactEmail: 'jane@example.com',
    contactPhone: '555-5678',
    availableFrom: '2024-10-01',
    availableTo: '2025-01-31',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'user2',
    user: {
      id: 'user2',
      supabaseId: 'supabase-user-2',
      email: 'jane@example.com',
      profilePicture: null,
      description: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/listings - Using mock data');
    
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    let filteredListings = [...mockListings];

    // Apply filters
    if (city) {
      filteredListings = filteredListings.filter(listing => 
        listing.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    if (state) {
      filteredListings = filteredListings.filter(listing => 
        listing.state.toLowerCase().includes(state.toLowerCase())
      );
    }

    if (minPrice) {
      const min = parseInt(minPrice);
      filteredListings = filteredListings.filter(listing => listing.price >= min);
    }

    if (maxPrice) {
      const max = parseInt(maxPrice);
      filteredListings = filteredListings.filter(listing => listing.price <= max);
    }

    console.log(`Returning ${filteredListings.length} listings`);
    
    // Return in the format the frontend expects
    return NextResponse.json({ listings: filteredListings });
  } catch (error) {
    console.error('Error in listings API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('POST /api/listings - Received data:', body);

    // Validate required fields
    const requiredFields = ['title', 'description', 'city', 'state', 'price', 'contactName', 'contactEmail', 'contactPhone', 'availableFrom', 'availableTo'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create new listing with mock ID
    const newListing = {
      id: `listing-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: body.userId || 'mock-user-id'
    };

    console.log('Created new listing:', newListing);
    return NextResponse.json(newListing, { status: 201 });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
} 