import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// POST /api/sheets/import - Import Excel file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // TODO: Get userId from session/auth
    const userId = 'temp-user-id'; // Replace with actual auth
    
    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Convert to Fortune Sheet format
    const fortuneSheetData = convertXLSXToFortuneSheet(workbook);
    
    // Extract metadata
    const sheetCount = workbook.SheetNames.length;
    let maxRows = 100;
    let maxCols = 26;
    
    // Calculate max dimensions
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      maxRows = Math.max(maxRows, range.e.r + 1);
      maxCols = Math.max(maxCols, range.e.c + 1);
    });
    
    // Create sheet in database
    const sheet = await prisma.sheet.create({
      data: {
        userId,
        name: file.name.replace(/\.(xlsx?|csv)$/i, '') || 'Imported Sheet',
        description: `Imported from ${file.name}`,
        data: fortuneSheetData,
        excelFile: buffer,
        fileSize: buffer.length,
        mimeType: file.type,
        sheetCount,
        rowCount: maxRows,
        columnCount: maxCols,
        lastModifiedBy: userId,
        lastAccessedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      id: sheet.id,
      name: sheet.name,
      sheetCount: sheet.sheetCount,
      rowCount: sheet.rowCount,
      columnCount: sheet.columnCount,
    });
  } catch (error) {
    console.error('Error importing Excel file:', error);
    return NextResponse.json(
      { error: 'Failed to import Excel file' },
      { status: 500 }
    );
  }
}

// Helper function to convert XLSX to Fortune Sheet format
function convertXLSXToFortuneSheet(workbook: XLSX.WorkBook) {
  const sheets: any[] = [];
  
  workbook.SheetNames.forEach((sheetName, index) => {
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    const celldata: any[] = [];
    
    // Convert each cell
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        const cell = worksheet[cellAddress];
        
        if (cell) {
          const cellData: any = {
            r,
            c,
            v: {}
          };
          
          // Handle different cell types
          if (cell.f) {
            // Formula
            cellData.v.f = '=' + cell.f;
            cellData.v.v = cell.v;
          } else if (cell.v !== undefined) {
            // Value
            if (typeof cell.v === 'number') {
              cellData.v.v = cell.v;
              cellData.v.ct = { fa: 'General', t: 'n' };
            } else if (typeof cell.v === 'boolean') {
              cellData.v.v = cell.v ? 1 : 0;
              cellData.v.m = cell.v ? 'TRUE' : 'FALSE';
              cellData.v.ct = { fa: 'General', t: 'b' };
            } else if (cell.v instanceof Date) {
              cellData.v.v = XLSX.SSF.parse_date_code(cell.v);
              cellData.v.ct = { fa: 'yyyy-MM-dd', t: 'd' };
            } else {
              // String
              cellData.v.v = String(cell.v);
              cellData.v.m = String(cell.v);
              cellData.v.ct = { fa: 'General', t: 's' };
            }
          }
          
          // Handle styles if available
          if (cell.s) {
            // This would need more detailed implementation based on cell.s structure
            cellData.v.bg = cell.s.fgColor?.rgb || null;
            cellData.v.fc = cell.s.font?.color?.rgb || '#000000';
            cellData.v.bl = cell.s.font?.bold || 0;
            cellData.v.it = cell.s.font?.italic || 0;
            cellData.v.fs = cell.s.font?.sz || 11;
            cellData.v.ff = cell.s.font?.name || 'Arial';
          }
          
          celldata.push(cellData);
        }
      }
    }
    
    // Create Fortune Sheet structure
    const sheetData = {
      name: sheetName,
      index: index,
      status: 1,
      order: index,
      celldata,
      config: {
        columnlen: {},
        rowlen: {},
        rowhidden: {},
        colhidden: {},
        borderInfo: [],
      },
      pivotTable: null,
      isPivotTable: false,
      frozen: {},
      chart: [],
      zoomRatio: 1,
      image: [],
      showGridLines: 1,
    };
    
    // Add column widths if available
    if (worksheet['!cols']) {
      worksheet['!cols'].forEach((col: any, idx: number) => {
        if (col?.wpx) {
          sheetData.config.columnlen[idx] = col.wpx;
        }
      });
    }
    
    // Add row heights if available
    if (worksheet['!rows']) {
      worksheet['!rows'].forEach((row: any, idx: number) => {
        if (row?.hpx) {
          sheetData.config.rowlen[idx] = row.hpx;
        }
      });
    }
    
    sheets.push(sheetData);
  });
  
  return sheets;
}