import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const sprintId = searchParams.get('sprintId');
    const assigneeId = searchParams.get('assigneeId');

    const where: any = {};
    if (projectId && projectId !== 'ALL') where.projectId = projectId;
    if (sprintId && sprintId !== 'ALL') where.sprintId = sprintId;
    if (assigneeId) {
      where.OR = [
        { assigneeId: assigneeId },
        { assignees: { some: { userId: assigneeId } } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: true,
        assignees: {
          include: { user: true },
        },
        reporter: true,
        project: true,
        sprint: true,
        backlogItem: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = await getPrisma();
    const body: any = await request.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ success: false, error: 'โปรดระบุชื่อการ์ดงาน (Title)' }, { status: 400 });
    }

    let targetProjectId = body.projectId;
    let targetSprintId = body.sprintId;

    if (targetSprintId && (!targetProjectId || targetProjectId === '')) {
      const sprintObj = await prisma.sprint.findUnique({ where: { id: targetSprintId } });
      if (sprintObj) targetProjectId = sprintObj.projectId;
    }

    if (!targetProjectId || targetProjectId === '') {
      const firstProject = await prisma.project.findFirst();
      if (firstProject) targetProjectId = firstProject.id;
    }

    if (!targetSprintId || targetSprintId === '') {
      const firstSprint = await prisma.sprint.findFirst({ where: { projectId: targetProjectId } });
      if (firstSprint) targetSprintId = firstSprint.id;
    }

    let reporterId = body.reporterId;
    if (!reporterId || reporterId === '') {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) reporterId = firstUser.id;
    }

    // Support multiple assignee IDs
    const assigneeIds: string[] = Array.isArray(body.assigneeIds) && body.assigneeIds.length > 0
      ? body.assigneeIds
      : (body.assigneeId ? [body.assigneeId] : [reporterId]);

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description || null,
        projectId: targetProjectId,
        sprintId: targetSprintId,
        backlogItemId: body.backlogItemId || null,
        assigneeId: assigneeIds[0] || null,
        reporterId: reporterId || null,
        status: body.status || 'TODO',
        priority: body.priority || 'MEDIUM',
        myTaskCategory: body.myTaskCategory || 'THIS_WEEK',
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        assignees: {
          create: assigneeIds.map((userId: string) => ({ userId })),
        },
      },
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
      await prisma.sprintBacklogItem.update({
        where: { id: task.backlogItemId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    console.error('Create Task Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
