import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  contentType: z.enum(['MARKDOWN', 'RICH_TEXT', 'PLAIN_TEXT']).optional(),
  folderId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

// GET /api/notes/[id] - Get a specific note
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);

    const note = await prisma.note.findFirst({
      where: {
        id: (await context.params).id,
        userId: user.id,
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
    });

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Update virtual path
    const noteWithPath = {
      ...note,
      virtualPath: `/notes/${note.folder?.name || 'unfiled'}/${note.id}`,
    };

    // Update last accessed
    await prisma.workspaceItem.upsert({
      where: {
        userId_type_itemId: {
          userId: user.id,
          type: 'NOTE',
          itemId: note.id,
        },
      },
      update: {
        lastAccessedAt: new Date(),
        accessCount: { increment: 1 },
      },
      create: {
        userId: user.id,
        type: 'NOTE',
        itemId: note.id,
        lastAccessedAt: new Date(),
        accessCount: 1,
      },
    });

    return NextResponse.json({ note: noteWithPath });
  } catch (error) {
    console.error('Get note error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// PATCH /api/notes/[id] - Update a note
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const data = updateNoteSchema.parse(body);

    // Check ownership
    const existing = await prisma.note.findFirst({
      where: {
        id: (await context.params).id,
        userId: user.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    const note = await prisma.note.update({
      where: { id: (await context.params).id },
      data: {
        ...data,
        updatedAt: new Date(),
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

    // Update virtual path
    const noteWithPath = {
      ...note,
      virtualPath: `/notes/${note.folder?.name || 'unfiled'}/${note.id}`,
    };

    // Track activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'note.updated',
        entityType: 'note',
        entityId: note.id,
        title: `Updated note: ${note.title}`,
        metadata: { noteId: note.id },
      },
    });

    return NextResponse.json({ note: noteWithPath });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update note error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// DELETE /api/notes/[id] - Delete a note (soft delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);

    // Check ownership
    const existing = await prisma.note.findFirst({
      where: {
        id: (await context.params).id,
        userId: user.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.note.update({
      where: { id: (await context.params).id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Track activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'note.deleted',
        entityType: 'note',
        entityId: (await context.params).id,
        title: `Deleted note: ${existing.title}`,
        metadata: { noteId: (await context.params).id },
      },
    });

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}