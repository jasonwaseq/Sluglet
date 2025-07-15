import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;
    const body = await req.json();
    console.log('PUT request received:', { listingId, body });
    
    const {
      title,
      description,
      price,
      location,
      imageUrl,
      images,
      contactName,
      contactEmail,
      contactPhone,
      availableFrom,
      availableTo,
      amenities,
      supabaseId
    } = body;

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' }, 
        { status: 400 }
      );
    }

    if (!supabaseId) {
      return NextResponse.json(
        { error: 'Supabase ID is required' }, 
        { status: 400 }
      );
    }

    // Validate required fields
    if (!title || !description || !price || !location || 
        !contactName || !contactEmail || !contactPhone || !availableFrom || !availableTo) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Validate date range
    if (new Date(availableFrom) >= new Date(availableTo)) {
      return NextResponse.json(
        { error: 'Available To date must be after Available From date' }, 
        { status: 400 }
      );
    }

    // Find the user by supabaseId
    const user = await prisma.user.findUnique({
      where: { supabaseId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Find the listing and verify ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true }
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' }, 
        { status: 404 }
      );
    }

    if (listing.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to edit this listing' }, 
        { status: 403 }
      );
    }

    console.log('Updating listing with data:', {
      title,
      description,
      price: parseInt(price),
      location,
      imageUrl: imageUrl || null,
      images: images ? JSON.stringify(images) : null,
      amenities,
      contactName,
      contactEmail,
      contactPhone,
      availableFrom,
      availableTo
    });

    // Update the listing
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        title,
        description,
        price: parseInt(price),
        location,
        imageUrl: imageUrl || null,
        images: images ? JSON.stringify(images) : null,
        amenities: amenities ? JSON.stringify(amenities) : '[]',
        contactName,
        contactEmail,
        contactPhone,
        availableFrom,
        availableTo
      }
    });

    console.log('Listing updated successfully:', updatedListing);
    return NextResponse.json({ listing: updatedListing });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update listing' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;
    const body = await req.json();
    const { supabaseId } = body;

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' }, 
        { status: 400 }
      );
    }

    if (!supabaseId) {
      return NextResponse.json(
        { error: 'Supabase ID is required' }, 
        { status: 400 }
      );
    }

    // Find the user by supabaseId
    const user = await prisma.user.findUnique({
      where: { supabaseId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Find the listing and verify ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true }
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' }, 
        { status: 404 }
      );
    }

    if (listing.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this listing' }, 
        { status: 403 }
      );
    }

    // Delete the listing
    await prisma.listing.delete({
      where: { id: listingId }
    });

    return NextResponse.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing' }, 
      { status: 500 }
    );
  }
} 