import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { firebaseId, description, profilePicture } = body;
    
    if (!firebaseId) {
      return NextResponse.json({ error: 'Missing firebaseId' }, { status: 400 });
    }
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { firebaseId },
      data: {
        description: description || null,
        profilePicture: profilePicture || null,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
} 