import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  console.log('API route /api/user called');
  try {
    const body = await req.json();
    console.log('Request body:', body);
    
    const { firebaseId, email } = body;
    if (!firebaseId || !email) {
      console.log('Missing fields:', { firebaseId, email });
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    console.log('Creating user with:', { firebaseId, email });
    // Create user in database if not exists
    const user = await prisma.user.upsert({
      where: { firebaseId },
      update: {},
      create: { firebaseId, email },
    });
    
    console.log('User created/updated:', user);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 