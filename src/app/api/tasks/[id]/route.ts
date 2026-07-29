export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function syncParentBacklogStatus(backlogItemId: string) {
  const siblingJobs = await prisma.task.findMany({
    where: { backlogItemId },
  });

  const totalJobs = siblingJobs.length;
  if (totalJobs === 0) return;

  const completedJobs = siblingJobs.filter((j) => j.status === 'DONE' || j.myTaskCategory === 'DONE').length;
  const activeJobs = siblingJobs.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'IN_REVIEW').length;

  let newBacklogStatus = 'PLANNED';

  if (completedJobs === totalJobs) {
    newBacklogStatus = 'SUCCESS';
  } else if (completedJobs > 0 || activeJobs > 0) {
    newBacklogStatus = 'IN_PROGRESS';
  } else {
    newBacklogStatus = 'PLANNED';
  }

  await prisma.sprintBacklogItem.update({
    where: { id: backlogItemId },
    data: { status: newBacklogStatus },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body: any = await request.json();

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.orderIndex !== undefined) updateData.orderIndex = body.orderIndex;

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'DONE') {
        updateData.myTaskCategory = 'DONE';
      } else if (body.status === 'TODO' || body.status === 'IN_PROGRESS') {
        updateData.myTaskCategory = 'THIS_WEEK';
      }
    }

    if (body.myTaskCategory !== undefined) {
      updateData.myTaskCategory = body.myTaskCategory;
      if (body.myTaskCategory === 'DONE') {
        updateData.status = 'DONE';
      } else {
        updateData.status = 'IN_PROGRESS';
      }
    }

    // Multiple Assignees update logic
    if (Array.isArray(body.assigneeIds)) {
      updateData.assigneeId = body.assigneeIds[0] || null;
      updateData.assignees = {
        deleteMany: {},
        create: body.assigneeIds.map((userId: string) => ({ userId })),
      };
    } else if (body.assigneeId !== undefined) {
      updateData.assigneeId = body.assigneeId;
      updateData.assignees = {
        deleteMany: {},
        create: body.assigneeId ? [{ userId: body.assigneeId }] : [],
      };
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: true,
        assignees: {
          include: { user: true },
        },
        project: true,
        sprint: true,
        backlogItem: true,
      },
    });

    if (task.backlogItemId) {
      await syncParentBacklogStatus(task.backlogItemId);
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    await prisma.task.delete({ where: { id: taskId } });

    if (task?.backlogItemId) {
      await syncParentBacklogStatus(task.backlogItemId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
