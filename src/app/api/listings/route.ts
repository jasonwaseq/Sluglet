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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase as needed
    },
  },
};

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
    const supabaseId = searchParams.get('supabaseId');

    // Build filters array for AND logic
    const filters = [];
    if (city) {
      filters.push({ city: { contains: city.trim(), mode: 'insensitive' as const } });
    }
    if (state) {
      filters.push({ state: { contains: state.trim(), mode: 'insensitive' as const } });
    }
    if (price) {
      const [min, max] = price.split('-').map(p => p === '+' ? undefined : parseInt(p));
      filters.push({
        price: {
          gte: min,
          ...(max && { lte: max })
        }
      });
    }
    if (property) {
      filters.push({ property });
    }
    if (bedrooms) {
      if (bedrooms === '6') {
        filters.push({ bedrooms: { gte: 6 } });
      } else {
        filters.push({ bedrooms: parseInt(bedrooms) });
      }
    }
    if (supabaseId) {
      console.log('Filtering by supabaseId:', supabaseId);
      filters.push({ user: { supabaseId } });
    }
    
    // Add amenities filtering at database level using JSON contains
    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim()).filter(Boolean);
      // Create a filter that checks if the amenities JSON contains all required amenities
      amenityList.forEach(amenity => {
        filters.push({
          amenities: {
            contains: `"${amenity}"`
          }
        });
      });
    }
    
    if (duration) {
      const parts = duration.split('-');
      if (parts.length === 6) {
        const from = `${parts[0]}-${parts[1]}-${parts[2]}`;
        const to = `${parts[3]}-${parts[4]}-${parts[5]}`;
        console.log('Date filter - search from:', from, 'to:', to);
        // A listing should be available for the entire search period
        // availableFrom <= search_start_date AND availableTo >= search_end_date
        filters.push({ availableFrom: { lte: from } });
        filters.push({ availableTo: { gte: to } });
      }
    }
    const whereClause = filters.length > 0 ? { AND: filters } : {};

    console.log('Database query whereClause:', whereClause);
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Use Promise.all to run count and findMany in parallel
    const [totalCount, listings] = await Promise.all([
      prisma.listing.count({ where: whereClause }),
      prisma.listing.findMany({
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
        },
        skip,
        take: limit
      })
    ]);
    
    console.log(`Found ${listings.length} listings from database`);
    
    // Parse images and amenities JSON only for the returned listings
    const listingsWithParsedData = listings.map((listing: Listing) => {
      let parsedImages = [];
      let parsedAmenities = [];
      
      try {
        parsedImages = listing.images ? JSON.parse(listing.images as string) : [];
      } catch {
        parsedImages = [];
      }
      
      try {
        parsedAmenities = listing.amenities ? JSON.parse(listing.amenities as string) : [];
      } catch {
        parsedAmenities = [];
      }
      
      return {
        ...listing,
        images: parsedImages,
        amenities: parsedAmenities
      };
    });

    return NextResponse.json({ listings: listingsWithParsedData, totalCount });
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
