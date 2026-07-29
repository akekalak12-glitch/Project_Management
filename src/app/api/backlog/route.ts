import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sprintId = searchParams.get('sprintId');
    const status = searchParams.get('status');

    const where: any = {};
    if (sprintId && sprintId !== 'ALL') where.sprintId = sprintId;
    if (status && status !== 'ALL') where.status = status;

    const items = await prisma.sprintBacklogItem.findMany({
      where,
      include: {
        sprint: {
          include: { project: true },
        },
        assignee: true,
        kanbanTasks: {
          include: { assignee: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await prisma.sprintBacklogItem.create({
      data: {
        title: body.title,
        description: body.description || null,
        priority: body.priority || 'MEDIUM',
        status: body.status || 'PLANNED',
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sprintId: body.sprintId,
        assigneeId: body.assigneeId || null,
      },
      include: {
        sprint: { include: { project: true } },
        assignee: true,
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
