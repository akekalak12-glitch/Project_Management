import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const userId = searchParams.get('userId');

    const where: any = {};
    if (sectionId) where.sectionId = sectionId;

    if (userId) {
      const requestingUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      const isFullAccess =
        requestingUser?.role?.key === 'SUPER_ADMIN' ||
        requestingUser?.role?.key === 'ADVISOR';

      if (!isFullAccess) {
        where.OR = [
          { ownerId: userId },
          { members: { some: { userId } } },
        ];
      }
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        section: true,
        owner: true,
        members: {
          include: { user: true },
        },
        okrs: true,
        sprints: {
          include: {
            backlogItems: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute progress % dynamically based on SUCCESS Sprint Backlog Items count
    const data = projects.map((p: any) => {
      const allBacklogs = p.sprints.flatMap((s: any) => s.backlogItems || []);
      const totalBacklogs = allBacklogs.length;
      const successBacklogs = allBacklogs.filter((b: any) => b.status === 'SUCCESS').length;
      const progress = totalBacklogs > 0 ? Math.round((successBacklogs / totalBacklogs) * 100) : 0;

      return {
        ...p,
        totalBacklogs,
        successBacklogs,
        progress,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = await getPrisma();
    const body: any = await request.json();
    const project = await prisma.project.create({
      data: {
        name: body.name,
        code: body.code,
        description: body.description,
        sectionId: body.sectionId,
        ownerId: body.ownerId,
        status: body.status || 'PLANNING',
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
    });

    // Automatically add Owner as member
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: body.ownerId,
        projectRole: 'OWNER',
      },
    });

    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
