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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb', // Increase as needed
    },
  },
};

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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ listingId: string }> }) {
  try {
    const { listingId } = await params;
    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }
    const body = await req.json();
    // Validate required fields (customize as needed)
    const requiredFields = ['title', 'description', 'city', 'state', 'bedrooms', 'property', 'price', 'contactName', 'contactEmail', 'contactPhone', 'availableFrom', 'availableTo'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    // Update the listing
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
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
        availableTo: body.availableTo
      },
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
    // Parse images and amenities JSON
    const listingWithParsedData = {
      ...updatedListing,
      images: updatedListing.images ? JSON.parse(updatedListing.images) : [],
      amenities: updatedListing.amenities ? JSON.parse(updatedListing.amenities) : []
    };
    return NextResponse.json({ listing: listingWithParsedData }, { status: 200 });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ listingId: string }> }) {
  try {
    const { listingId } = await params;
    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Get the user ID from the request body
    let supabaseId: string | undefined = undefined;
    try {
      const body = await req.json();
      supabaseId = body.supabaseId;
    } catch {
      // If no body or invalid JSON, treat as missing user
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch the listing to check ownership
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    // Check if the user is the owner
    const user = await prisma.user.findUnique({ where: { id: listing.userId } });
    if (!user || user.supabaseId !== supabaseId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the listing
    await prisma.listing.delete({ where: { id: listingId } });

    return NextResponse.json({ message: 'Listing deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
} 