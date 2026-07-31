export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id: projectId } = await params;
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          include: { role: true, section: true },
        },
      },
    });
    return NextResponse.json({ success: true, data: members });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id: projectId } = await params;
    const body: any = await request.json();
    const { userIds = [], projectRole = 'MEMBER' } = body;

    if (!Array.isArray(userIds)) {
      return NextResponse.json({ success: false, error: 'userIds must be an array' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const ownerId = project?.ownerId;

    // ทีมงานเลือกด้วย manual เท่านั้น ไม่บังคับผูก ผอ.ส่วน/หัวหน้าโครงการ เข้าทีมงานอัตโนมัติ
    // และสามารถนำ ผอ.ส่วน ออกจากทีมงานได้ตามที่เลือกจริง

    // Delete members not in the new userIds list
    await prisma.projectMember.deleteMany({
      where: {
        projectId,
        userId: { notIn: userIds },
      },
    });

    // Add or update members
    const results = [];
    for (const userId of userIds) {
      const isOwner = userId === ownerId;
      const roleToSave = isOwner ? 'OWNER' : projectRole;

      const member = await prisma.projectMember.upsert({
        where: {
          projectId_userId: { projectId, userId },
        },
        update: { projectRole: roleToSave },
        create: { projectId, userId, projectRole: roleToSave },
      });
      results.push(member);
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
