import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// GET /api/sheets/[id]/export - Export sheet to Excel
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sheet = await prisma.sheet.findUnique({
      where: { id: (await context.params).id },
    });
    
    if (!sheet) {
      return NextResponse.json(
        { error: 'Sheet not found' },
        { status: 404 }
      );
    }
    
    // If we have original Excel file, return it
    if (sheet.excelFile) {
      return new NextResponse(Buffer.from(sheet.excelFile), {
        headers: {
          'Content-Type': sheet.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${sheet.name}.xlsx"`,
        },
      });
    }
    
    // Otherwise, convert Fortune Sheet data to Excel
    const workbook = XLSX.utils.book_new();
    
    // Convert Fortune Sheet data to XLSX format
    // Fortune Sheet data structure needs to be converted
    const fortuneData = sheet.data as any;
    
    if (Array.isArray(fortuneData)) {
      // Multiple sheets
      fortuneData.forEach((sheetData: any, index: number) => {
        const worksheet = convertFortuneSheetToXLSX(sheetData);
        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          sheetData.name || `Sheet${index + 1}`
        );
      });
    } else {
      // Single sheet
      const worksheet = convertFortuneSheetToXLSX(fortuneData);
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        fortuneData.name || 'Sheet1'
      );
    }
    
    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });
    
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${sheet.name}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting sheet:', error);
    return NextResponse.json(
      { error: 'Failed to export sheet' },
      { status: 500 }
    );
  }
}

// Helper function to convert Fortune Sheet data to XLSX worksheet
function convertFortuneSheetToXLSX(fortuneData: any) {
  const celldata = fortuneData.celldata || [];
  const data: any[][] = [];
  
  // Find max row and column
  let maxRow = 0;
  let maxCol = 0;
  
  celldata.forEach((cell: any) => {
    if (cell.r > maxRow) maxRow = cell.r;
    if (cell.c > maxCol) maxCol = cell.c;
  });
  
  // Initialize empty array
  for (let r = 0; r <= maxRow; r++) {
    data[r] = new Array(maxCol + 1).fill('');
  }
  
  // Fill in cell data
  celldata.forEach((cell: any) => {
    if (cell.v) {
      // Get cell value
      let value = '';
      if (typeof cell.v === 'object') {
        if (cell.v.v !== undefined) {
          value = cell.v.v;
        } else if (cell.v.m) {
          value = cell.v.m;
        } else if (cell.v.f) {
          value = cell.v.f; // Formula
        }
      } else {
        value = cell.v;
      }
      data[cell.r][cell.c] = value;
    }
  });
  
  // Convert to worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Apply styles if available
  if (fortuneData.config) {
    // Apply column widths, row heights, etc.
    // This would need more detailed implementation based on Fortune Sheet's config structure
  }
  
  return worksheet;
}