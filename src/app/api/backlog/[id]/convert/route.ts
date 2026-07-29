import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: backlogItemId } = await params;
    const body: any = await request.json();

    const backlogItem = await prisma.sprintBacklogItem.findUnique({
      where: { id: backlogItemId },
      include: { sprint: true },
    });

    if (!backlogItem) {
      return NextResponse.json({ success: false, error: 'Backlog item not found' }, { status: 404 });
    }

    // Create corresponding Kanban Task
    const task = await prisma.task.create({
      data: {
        title: backlogItem.title,
        description: backlogItem.description,
        sprintId: backlogItem.sprintId,
        backlogItemId: backlogItem.id,
        projectId: backlogItem.sprint.projectId,
        assigneeId: body.assigneeId || backlogItem.assigneeId || null,
        reporterId: body.reporterId || null,
        status: 'TODO',
        priority: backlogItem.priority,
        myTaskCategory: 'THIS_WEEK',
      },
      include: {
        assignee: true,
        project: true,
      },
    });

    // Update Backlog Item status to IN_PROGRESS
    await prisma.sprintBacklogItem.update({
      where: { id: backlogItemId },
      data: { status: 'IN_PROGRESS' },
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
