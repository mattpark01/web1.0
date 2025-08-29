import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('sessionId')?.value;

    if (sessionId) {
      // Clear session in database
      await prisma.user.updateMany({
        where: { sessionId },
        data: { sessionId: null },
      });
    }

    // Clear session cookie
    const response = NextResponse.json({ 
      message: 'Logged out successfully' 
    });

    response.cookies.delete('sessionId');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}