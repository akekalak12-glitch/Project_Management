import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const cadence = searchParams.get('cadence');
    const userId = searchParams.get('userId');

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (cadence && cadence !== 'ALL') where.cadence = cadence;

    if (userId) {
      const requestingUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      const isFullAccess =
        requestingUser?.role?.key === 'SUPER_ADMIN' ||
        requestingUser?.role?.key === 'ADVISOR';

      if (!isFullAccess) {
        where.project = {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        };
      }
    }

    const sprints = await prisma.sprint.findMany({
      where,
      include: {
        project: true,
        tasks: {
          include: {
            assignee: true,
          },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: sprints });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = await getPrisma();
    const body: any = await request.json();

    let targetProjectId = body.projectId;
    if (!targetProjectId || targetProjectId === '') {
      const firstProject = await prisma.project.findFirst();
      if (firstProject) {
        targetProjectId = firstProject.id;
      } else {
        return NextResponse.json({ success: false, error: 'ไม่พบโครงการในระบบ' }, { status: 400 });
      }
    }

    const sprint = await prisma.sprint.create({
      data: {
        name: body.name,
        goal: body.goal || null,
        projectId: targetProjectId,
        cadence: body.cadence || 'WEEKLY', // WEEKLY, MONTHLY
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: body.isActive ?? true,
        status: body.status || 'ACTIVE',
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json({ success: true, data: sprint });
  } catch (error: any) {
    console.error('Create Sprint API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
