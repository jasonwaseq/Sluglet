import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// Define Listing type for type safety
interface Listing {
  id: string;
  title: string;
  description: string;
  city: string;
  state: string;
  price: number;
  imageUrl?: string | null;
  images?: string | null;
  amenities: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  availableFrom: string;
  availableTo: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: {
    email: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      city,
      state,
      price,
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

    // Validate required fields
    if (!title || !description || !city || !state || !price || 
        !contactName || !contactEmail || !contactPhone || !availableFrom || !availableTo || !supabaseId) {
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

    // Find user by supabaseId
    const user = await prisma.user.findUnique({
      where: { supabaseId }
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
        city,
        state,
        price: parseInt(price),
        imageUrl: imageUrl || null,
        images: images ? JSON.stringify(images) : null, // Store images as JSON string
        amenities,
        contactName,
        contactEmail,
        contactPhone,
        availableFrom,
        availableTo,
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
    const availableFrom = searchParams.get('availableFrom') || '';
    const availableTo = searchParams.get('availableTo') || '';
    const duration = searchParams.get('duration') || '';
    const amenities = searchParams.get('amenities') || '';
    const supabaseId = searchParams.get('supabaseId') || '';
    const city = searchParams.get('city') || '';
    const state = searchParams.get('state') || '';

    let whereClause: Record<string, unknown> = {};
    const conditions: Record<string, unknown>[] = [];
    let searchStartDate: string | undefined;
    let searchEndDate: string | undefined;

    // Add search filters
    if (query) {
      conditions.push({
        OR: [
          { title: { contains: query } },
          { city: { contains: query } },
          { state: { contains: query } }
        ]
      });
    }



    // Filter by amenities
    if (amenities) {
      const amenityList = amenities.split(',');
      console.log('Amenity filtering:', { amenities: amenityList });
      
      // For each selected amenity, check if it's contained in the listing's amenities
      amenityList.forEach(amenity => {
        conditions.push({
          amenities: { contains: amenity }
        });
      });
      console.log('Amenity conditions added');
    }

    if (price) {
      const [min, max] = price.split('-').map(p => p === '+' ? undefined : parseInt(p));
      conditions.push({
        price: {
          gte: min,
          ...(max && { lte: max })
        }
      });
    }

    // Filter by duration (date range overlap)
    if (duration) {
      // Handle duration format: "YYYY-MM-DD-YYYY-MM-DD" (e.g., "2025-10-13-2025-11-19")
      const parts = duration.split('-');
      
      if (parts.length === 6) {
        // Format: "YYYY-MM-DD-YYYY-MM-DD"
        searchStartDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
        searchEndDate = `${parts[3]}-${parts[4]}-${parts[5]}`;
      } else if (parts.length === 2) {
        // Format: "start-end" (legacy)
        [searchStartDate, searchEndDate] = parts;
      }
      
      if (searchStartDate && searchEndDate) {
        console.log('Date filtering:', { start: searchStartDate, end: searchEndDate, duration });
        console.log('Search period:', { startDate: searchStartDate, endDate: searchEndDate });
        
        // Since dates are stored as strings in format "YYYY-MM-DD", string comparison works correctly
        // Show listings that are available for the ENTIRE search period
        // A listing must be available from before or on the search start date
        // AND available until after or on the search end date
        conditions.push({ 
          availableFrom: { lte: searchStartDate }  // Listing starts before or on search start date
        });
        conditions.push({ 
          availableTo: { gte: searchEndDate }      // Listing ends after or on search end date
        });
        
        // Additional validation: ensure the dates are in the correct format
        console.log('Date validation:');
        console.log(`  Search start: ${searchStartDate} (format: ${/^\d{4}-\d{2}-\d{2}$/.test(searchStartDate) ? 'valid' : 'invalid'})`);
        console.log(`  Search end: ${searchEndDate} (format: ${/^\d{4}-\d{2}-\d{2}$/.test(searchEndDate) ? 'valid' : 'invalid'})`);
        
        console.log('Date conditions added:', { 
          availableFrom: { lte: searchStartDate }, 
          availableTo: { gte: searchEndDate } 
        });
      }
    } else if (availableFrom || availableTo) {
      // Legacy support for availableFrom/availableTo
      if (availableFrom) {
        conditions.push({
          availableTo: {
            gte: availableFrom  // Listing ends after or on the specified start date
          }
        });
      }
      if (availableTo) {
        conditions.push({
          availableFrom: {
            lte: availableTo    // Listing starts before or on the specified end date
          }
        });
      }
    }

    // Filter by user (supabaseId)
    if (supabaseId) {
      const user = await prisma.user.findUnique({
        where: { supabaseId }
      });
      
      if (user) {
        conditions.push({ userId: user.id });
      } else {
        return NextResponse.json({ listings: [] });
      }
    }

    // Filter by city
    if (city) {
      conditions.push({ city: { contains: city } });
    }
    // Filter by state
    if (state) {
      conditions.push({ state: { contains: state } });
    }

    // Construct final whereClause
    if (conditions.length > 0) {
      whereClause.AND = conditions;
    } else {
      // If no conditions, return all listings
      whereClause = {};
    }

    console.log('Final whereClause:', JSON.stringify(whereClause, null, 2));
    
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
    
    console.log(`Found ${listings.length} listings`);
    
    // Post-process listings to ensure date filtering is correct
    let finalListings = listings;
    if (duration || availableFrom || availableTo) {
      console.log('=== POST-PROCESSING DATE FILTER ===');
      const searchStartStr = searchStartDate || availableFrom;
      const searchEndStr = searchEndDate || availableTo;
      
      finalListings = listings.filter((listing: Listing) => {
        const listingStartStr = listing.availableFrom;
        const listingEndStr = listing.availableTo;
        
        // String comparison for dates in YYYY-MM-DD format
        const shouldInclude = listingStartStr <= searchStartStr && listingEndStr >= searchEndStr;
        
        console.log(`Listing: ${listing.title}`);
        console.log(`  Available: ${listingStartStr} to ${listingEndStr}`);
        console.log(`  Search period: ${searchStartStr} to ${searchEndStr}`);
        console.log(`  Should include: ${shouldInclude}`);
        console.log(`    Start check: ${listingStartStr} <= ${searchStartStr} = ${listingStartStr <= searchStartStr}`);
        console.log(`    End check: ${listingEndStr} >= ${searchEndStr} = ${listingEndStr >= searchEndStr}`);
        console.log('---');
        
        return shouldInclude;
      });
      
      console.log(`After post-processing: ${finalListings.length} listings remain`);
    }
    
    // Log all listings with their date ranges for debugging
    if (duration || availableFrom || availableTo) {
      console.log('=== FINAL DATE FILTERED LISTINGS ===');
      finalListings.forEach((listing: Listing) => {
        console.log(`Listing: ${listing.title}`);
        console.log(`  Available: ${listing.availableFrom} to ${listing.availableTo}`);
        console.log(`  Search period: ${searchStartDate || availableFrom} to ${searchEndDate || availableTo}`);
        
        // Check if the listing should actually be included using string comparison
        const listingStartStr = listing.availableFrom;
        const listingEndStr = listing.availableTo;
        const searchStartStr = searchStartDate || availableFrom;
        const searchEndStr = searchEndDate || availableTo;
        
        const shouldInclude = listingStartStr <= searchStartStr && listingEndStr >= searchEndStr;
        console.log(`  String comparison - Should include: ${shouldInclude}`);
        console.log(`    Listing start (${listingStartStr}) <= Search start (${searchStartStr}): ${listingStartStr <= searchStartStr}`);
        console.log(`    Listing end (${listingEndStr}) >= Search end (${searchEndStr}): ${listingEndStr >= searchEndStr}`);
        
        // Also check with Date objects for comparison
        const listingStart = new Date(listing.availableFrom);
        const listingEnd = new Date(listing.availableTo);
        const searchStart = new Date(searchStartStr);
        const searchEnd = new Date(searchEndStr);
        
        const shouldIncludeDate = listingStart <= searchStart && listingEnd >= searchEnd;
        console.log(`  Date comparison - Should include: ${shouldIncludeDate}`);
        console.log('---');
      });
    }
    

    


    // Parse images JSON for each listing
    const listingsWithParsedImages = finalListings.map((listing: Listing) => ({
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