import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check session
    const sessionId = request.cookies.get('sessionId')?.value;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from session
    const user = await prisma.user.findFirst({
      where: { sessionId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's API key
    const result = await prisma.$queryRawUnsafe(`
      SELECT api_key, name, created_at 
      FROM spatio_api_keys 
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `, user.id) as any[];

    if (!result || result.length === 0) {
      // Generate a new API key if user doesn't have one
      const apiKey = `spatio_${crypto.randomBytes(32).toString('hex')}`;
      
      await prisma.$executeRawUnsafe(`
        INSERT INTO spatio_api_keys (api_key, user_id, name, created_at, is_active)
        VALUES ($1, $2, $3, NOW(), true)
      `, apiKey, user.id, 'Default API Key');

      return NextResponse.json({ apiKey });
    }

    return NextResponse.json({ 
      apiKey: result[0].api_key,
      name: result[0].name,
      createdAt: result[0].created_at,
    });
  } catch (error) {
    console.error('Get API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}