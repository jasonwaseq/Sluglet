import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    const prisma = new PrismaClient();
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    const listingCount = await prisma.listing.count();
    console.log('Listing count:', listingCount);
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      userCount,
      listingCount,
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 