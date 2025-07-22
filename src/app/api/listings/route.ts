import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      price,
      duration,
      location,
      imageUrl,
      images,
      contactName,
      contactEmail,
      contactPhone,
      availableFrom,
      amenities,
      firebaseId
    } = body;

    // Validate required fields
    if (!title || !description || !price || !duration || !location || 
        !contactName || !contactEmail || !contactPhone || !availableFrom || !firebaseId) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Find user by firebaseId
    const user = await prisma.user.findUnique({
      where: { firebaseId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        price: parseInt(price),
        duration,
        location,
        imageUrl: imageUrl || null,
        images: images ? JSON.stringify(images) : null, // Store images as JSON string
        amenities,
        contactName,
        contactEmail,
        contactPhone,
        availableFrom,
        userId: user.id
      }
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  throw error;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const price = searchParams.get('price') || '';
    const duration = searchParams.get('duration') || '';

    const whereClause: Record<string, unknown> = {};

    // Add search filters
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (location) {
      whereClause.location = { contains: location, mode: 'insensitive' };
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

    // Parse images JSON for each listing
    const listingsWithParsedImages = listings.map(listing => ({
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