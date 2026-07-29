import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.permissionLevel !== undefined) updateData.permissionLevel = body.permissionLevel;
    if (body.menuPermissions !== undefined) {
      updateData.menuPermissions = typeof body.menuPermissions === 'string'
        ? body.menuPermissions
        : JSON.stringify(body.menuPermissions);
    }

    const role = await prisma.role.update({
      where: { id: roleId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: role });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
