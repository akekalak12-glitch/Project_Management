export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

// GET all Sub-Jobs under a Backlog Item
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id: backlogItemId } = await params;
    const jobs = await prisma.task.findMany({
      where: { backlogItemId },
      include: {
        assignee: true,
        project: true,
      },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create a Sub-Job under a Backlog Item assigned to a staff member
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id: backlogItemId } = await params;
    const body: any = await request.json();

    const backlogItem = await prisma.sprintBacklogItem.findUnique({
      where: { id: backlogItemId },
      include: { sprint: true },
    });

    if (!backlogItem) {
      return NextResponse.json({ success: false, error: 'ไม่พบรายการ Backlog' }, { status: 404 });
    }

    const job = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description || null,
        sprintId: backlogItem.sprintId,
        backlogItemId: backlogItem.id,
        projectId: backlogItem.sprint.projectId,
        assigneeId: body.assigneeId || null,
        reporterId: body.reporterId || null,
        status: body.status || 'TODO',
        priority: body.priority || backlogItem.priority || 'MEDIUM',
        myTaskCategory: 'THIS_WEEK',
      },
      include: {
        assignee: true,
        project: true,
      },
    });

    // Update parent Backlog Item status to IN_PROGRESS
    if (backlogItem.status === 'PLANNED') {
      await prisma.sprintBacklogItem.update({
        where: { id: backlogItemId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return NextResponse.json({ success: true, data: job });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
