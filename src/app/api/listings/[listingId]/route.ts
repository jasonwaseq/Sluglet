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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' }, 
        { status: 400 }
      );
    }

    console.log('GET /api/listings/[listingId] - Fetching from database for ID:', listingId);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: {
          select: {
            email: true,
            profilePicture: true,
            description: true
          }
        }
      }
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' }, 
        { status: 404 }
      );
    }

    // Parse images and amenities JSON
    const listingWithParsedData = {
      ...listing,
      images: listing.images ? JSON.parse(listing.images) : [],
      amenities: listing.amenities ? JSON.parse(listing.amenities) : []
    };

    return NextResponse.json({ listing: listingWithParsedData });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' }, 
      { status: 500 }
    );
  }
}

// PUT and DELETE functions can be implemented when needed
// export async function PUT(...) { ... }
// export async function DELETE(...) { ... } 