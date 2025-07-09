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
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' }, 
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const price = searchParams.get('price') || '';
    const duration = searchParams.get('duration') || '';

    let whereClause: any = {};

    // Add search filters
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (price) {
      const [min, max] = price.split('-').map(p => p === '+' ? undefined : parseInt(p));
      whereClause.price = {
        gte: min,
        ...(max && { lte: max })
      };
    }

    if (duration) {
      const [min, max] = duration.split('-').map(d => d === '+' ? undefined : parseInt(d));
      // This is a simplified filter - in a real app you'd want to parse duration strings
      // For now, we'll just store the duration as a string
    }

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
      images: listing.images ? JSON.parse(listing.images) : [],
      amenities: listing.amenities ? JSON.parse(listing.amenities) : []
    }));

    return NextResponse.json({ listings: listingsWithParsedImages });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' }, 
      { status: 500 }
    );
  }
} 