import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const createNoteSchema = z.object({
  title: z.string(),
  content: z.string(),
  contentType: z.enum(['MARKDOWN', 'RICH_TEXT', 'PLAIN_TEXT']).optional(),
  folderId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
});

// GET /api/notes - List user's notes
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const archived = searchParams.get('archived') === 'true';
    
    const notes = await prisma.note.findMany({
      where: {
        userId: user.id,
        ...(folderId && { folderId }),
        ...(tag && { tags: { has: tag } }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        }),
        isArchived: archived,
        deletedAt: null,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    // Update virtual paths
    const notesWithPaths = notes.map(note => ({
      ...note,
      virtualPath: `/notes/${note.folder?.name || 'unfiled'}/${note.id}`,
    }));

    return NextResponse.json({ notes: notesWithPaths });
  } catch (error) {
    console.error('Get notes error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const data = createNoteSchema.parse(body);

    const note = await prisma.note.create({
      data: {
        userId: user.id,
        title: data.title,
        content: data.content,
        contentType: data.contentType || 'MARKDOWN',
        folderId: data.folderId,
        tags: data.tags || [],
        isPinned: data.isPinned || false,
        isFavorite: data.isFavorite || false,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    // Set virtual path
    const noteWithPath = {
      ...note,
      virtualPath: `/notes/${note.folder?.name || 'unfiled'}/${note.id}`,
    };

    // Track activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'note.created',
        entityType: 'note',
        entityId: note.id,
        title: `Created note: ${note.title}`,
        metadata: { noteId: note.id },
      },
    });

    return NextResponse.json({ note: noteWithPath }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create note error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}