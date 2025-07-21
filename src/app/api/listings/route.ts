import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
    
    console.log(`Found ${listings.length} listings from database`);
    
    // Parse images and amenities JSON for each listing
    const listingsWithParsedData = listings.map((listing) => ({
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