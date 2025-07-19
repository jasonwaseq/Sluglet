import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'API key not found',
      message: 'Make sure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set in your .env file'
    }, { status: 400 });
  }

  // Test the API key with a simple geocoding request
  try {
    const testAddress = '1600 Amphitheatre Parkway, Mountain View, CA';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testAddress)}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      return NextResponse.json({
        success: true,
        message: 'API key is working correctly',
        testResult: {
          address: testAddress,
          coordinates: data.results[0]?.geometry?.location
        }
      });
    } else {
      return NextResponse.json({
        error: 'API key test failed',
        status: data.status,
        message: data.error_message || 'Unknown error'
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to test API key',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 