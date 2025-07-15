import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all listings
    const allListings = await prisma.listing.findMany({
      select: {
        id: true,
        title: true,
        location: true,
        price: true,
      }
    });

    // Test location filtering
    const marsListings = await prisma.listing.findMany({
      where: {
        location: { contains: 'mars' }
      },
      select: {
        id: true,
        title: true,
        location: true,
        price: true,
      }
    });

    return NextResponse.json({
      allListings,
      marsListings,
      totalListings: allListings.length,
      marsListingsCount: marsListings.length
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({ error: 'Failed to fetch test data' }, { status: 500 });
  }
} 