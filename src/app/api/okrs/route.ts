import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const sectionId = searchParams.get('sectionId');

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (sectionId) where.sectionId = sectionId;

    const okrs = await prisma.oKR.findMany({
      where,
      include: {
        project: true,
        section: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: okrs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: any = await request.json();
    const target = Number(body.targetValue) || 100;
    const current = Number(body.currentValue) || 0;
    const progress = Math.min(100, Math.round((current / target) * 100));

    const okr = await prisma.oKR.create({
      data: {
        objective: body.objective,
        keyResult: body.keyResult,
        targetValue: target,
        currentValue: current,
        unit: body.unit || '%',
        projectId: body.projectId || null,
        sectionId: body.sectionId || null,
        progress,
        status: progress >= 75 ? 'ON_TRACK' : progress >= 40 ? 'AT_RISK' : 'BEHIND',
      },
    });

    return NextResponse.json({ success: true, data: okr });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
