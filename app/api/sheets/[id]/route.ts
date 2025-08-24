import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// GET /api/sheets/[id] - Get specific sheet
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sheet = await prisma.sheet.findUnique({
      where: { id: (await context.params).id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 10, // Last 10 versions
        },
      },
    });
    
    if (!sheet) {
      return NextResponse.json(
        { error: 'Sheet not found' },
        { status: 404 }
      );
    }
    
    // Update last accessed timestamp
    await prisma.sheet.update({
      where: { id: (await context.params).id },
      data: { lastAccessedAt: new Date() },
    });
    
    return NextResponse.json(sheet);
  } catch (error) {
    console.error('Error fetching sheet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sheet' },
      { status: 500 }
    );
  }
}

// PUT /api/sheets/[id] - Update sheet
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { data, name, description, createVersion } = body;
    
    // TODO: Get userId from session/auth
    const userId = 'temp-user-id'; // Replace with actual auth
    
    // Get current sheet for versioning
    const currentSheet = await prisma.sheet.findUnique({
      where: { id: (await context.params).id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });
    
    if (!currentSheet) {
      return NextResponse.json(
        { error: 'Sheet not found' },
        { status: 404 }
      );
    }
    
    // Create version if requested
    if (createVersion) {
      const lastVersion = currentSheet.versions[0]?.version || 0;
      await prisma.sheetVersion.create({
        data: {
          sheetId: (await context.params).id,
          version: lastVersion + 1,
          data: currentSheet.data as any,
          changedBy: userId,
          changeNote: body.changeNote,
        },
      });
    }
    
    // Update sheet
    const updatedSheet = await prisma.sheet.update({
      where: { id: (await context.params).id },
      data: {
        data,
        name,
        description,
        lastModifiedBy: userId,
        lastAccessedAt: new Date(),
      },
    });
    
    return NextResponse.json(updatedSheet);
  } catch (error) {
    console.error('Error updating sheet:', error);
    return NextResponse.json(
      { error: 'Failed to update sheet' },
      { status: 500 }
    );
  }
}

// DELETE /api/sheets/[id] - Delete sheet
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await prisma.sheet.delete({
      where: { id: (await context.params).id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sheet:', error);
    return NextResponse.json(
      { error: 'Failed to delete sheet' },
      { status: 500 }
    );
  }
}