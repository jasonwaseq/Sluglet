import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Listing } from '@prisma/client';

let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  } catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  throw error;
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/listings - Fetching from database');
    
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const price = searchParams.get('price');
    const property = searchParams.get('property');
    const bedrooms = searchParams.get('bedrooms');
    const amenities = searchParams.get('amenities'); // comma-separated
    const duration = searchParams.get('duration'); // format: YYYY-MM-DD-YYYY-MM-DD

    const whereClause: Record<string, unknown> = {};

    // Apply filters
    if (city) {
      whereClause.city = { contains: city };
    }

    if (state) {
      whereClause.state = { contains: state };
    }

    if (price) {
      const [min, max] = price.split('-').map(p => p === '+' ? undefined : parseInt(p));
      whereClause.price = {
          gte: min,
          ...(max && { lte: max })
      };
    }

    if (property) {
      whereClause.property = property;
    }

    if (bedrooms) {
      // Support "6+" as 6 or more
      if (bedrooms === '6') {
        whereClause.bedrooms = { gte: 6 };
      } else {
        whereClause.bedrooms = parseInt(bedrooms);
      }
    }

    // Date range filter (duration)
    if (duration) {
      // Format: YYYY-MM-DD-YYYY-MM-DD
      const [from, to] = duration.split('-');
      if (from && to) {
        whereClause.AND = [
          { availableFrom: { lte: to } }, // listing available from before or on 'to'
          { availableTo: { gte: from } }   // listing available to after or on 'from'
        ];
      }
    }

    // Amenity filter (must contain all selected amenities)
    let amenityList: string[] = [];
    if (amenities) {
      amenityList = amenities.split(',').map(a => a.trim()).filter(Boolean);
    }

    console.log('Database query whereClause:', whereClause);
    
    const listings = await prisma.listing.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Filter by amenities in-memory (since amenities is stored as JSON string)
    let filteredListings = listings;
    if (amenityList.length > 0) {
      filteredListings = listings.filter((listing: Listing) => {
        let listingAmenities: string[] = [];
        try {
          listingAmenities = typeof listing.amenities === 'string' ? JSON.parse(listing.amenities) : listing.amenities;
        } catch {
          listingAmenities = [];
        }
        // Must contain all selected amenities
        return amenityList.every(a => listingAmenities.includes(a));
      });
    }

    console.log(`Found ${filteredListings.length} listings from database`);
    
    // Parse images and amenities JSON for each listing
    const listingsWithParsedData = filteredListings.map((listing: Listing) => ({
      ...listing,
      images: listing.images ? JSON.parse(listing.images as string) : [],
      amenities: listing.amenities ? JSON.parse(listing.amenities as string) : []
    }));

    return NextResponse.json({ listings: listingsWithParsedData });
  } catch (error) {
    console.error('Error fetching listings:', error);
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
    const requiredFields = ['title', 'description', 'city', 'state', 'bedrooms', 'property', 'price', 'contactName', 'contactEmail', 'contactPhone', 'availableFrom', 'availableTo', 'supabaseId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Find user by supabaseId
    let user = await prisma.user.findUnique({
      where: { supabaseId: body.supabaseId }
    });

    // If user does not exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          supabaseId: body.supabaseId,
          email: body.contactEmail,
          description: '',
          profilePicture: null
        }
      });
    }

    // Create new listing in database
    const newListing = await prisma.listing.create({
      data: {
        title: body.title,
        description: body.description,
        address: body.address || null,
        city: body.city,
        bedrooms: parseInt(body.bedrooms),
        property: body.property,
        state: body.state,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        price: parseInt(body.price),
        imageUrl: body.imageUrl || null,
        images: body.images ? JSON.stringify(body.images) : null,
        amenities: body.amenities ? JSON.stringify(body.amenities) : '[]',
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        availableFrom: body.availableFrom,
        availableTo: body.availableTo,
        userId: user.id
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    console.log('Created new listing in database:', newListing);
    return NextResponse.json(newListing, { status: 201 });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
} 