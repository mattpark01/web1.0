import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/sheets - List user's sheets
export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from session/auth
    const userId = 'temp-user-id'; // Replace with actual auth
    
    const sheets = await prisma.sheet.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        sheetCount: true,
        rowCount: true,
        columnCount: true,
        fileSize: true,
        lastAccessedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    return NextResponse.json(sheets);
  } catch (error) {
    console.error('Error fetching sheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sheets' },
      { status: 500 }
    );
  }
}

// POST /api/sheets - Create new sheet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, data, excelFile, mimeType } = body;
    
    // TODO: Get userId from session/auth
    const userId = 'temp-user-id'; // Replace with actual auth
    
    // Process Excel file if provided
    let excelBuffer = null;
    let fileSize = null;
    if (excelFile) {
      // Convert base64 to buffer if needed
      excelBuffer = Buffer.from(excelFile, 'base64');
      fileSize = excelBuffer.length;
    }
    
    const sheet = await prisma.sheet.create({
      data: {
        userId,
        name: name || 'Untitled Spreadsheet',
        description,
        data: data || {
          // Default Fortune Sheet data structure
          name: 'Sheet1',
          index: 0,
          status: 1,
          order: 0,
          celldata: [],
          config: {},
          pivotTable: null,
          isPivotTable: false,
        },
        excelFile: excelBuffer,
        fileSize,
        mimeType,
        lastModifiedBy: userId,
        lastAccessedAt: new Date(),
      },
    });
    
    return NextResponse.json(sheet);
  } catch (error) {
    console.error('Error creating sheet:', error);
    return NextResponse.json(
      { error: 'Failed to create sheet' },
      { status: 500 }
    );
  }
}