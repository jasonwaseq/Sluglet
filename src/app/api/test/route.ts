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
        city: true,
        state: true,
        price: true,
      }
    });

    // Test city/state filtering
    const marsListings = await prisma.listing.findMany({
      where: {
        OR: [
          { city: { contains: 'mars' } },
          { state: { contains: 'mars' } }
        ]
      },
      select: {
        id: true,
        title: true,
        city: true,
        state: true,
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