import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { id: projectId } = await params;
    const body = await request.json();
    const { userIds = [], projectRole = 'MEMBER' } = body;

    if (!Array.isArray(userIds)) {
      return NextResponse.json({ success: false, error: 'userIds must be an array' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const ownerId = project?.ownerId;

    // Ensure ownerId is always preserved in userIds list
    const updatedUserIds = ownerId && !userIds.includes(ownerId) ? [...userIds, ownerId] : userIds;

    // Delete members not in new userIds list (except OWNER)
    await prisma.projectMember.deleteMany({
      where: {
        projectId,
        projectRole: { not: 'OWNER' },
        userId: { notIn: updatedUserIds },
      },
    });

    // Add or update members
    const results = [];
    for (const userId of updatedUserIds) {
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
