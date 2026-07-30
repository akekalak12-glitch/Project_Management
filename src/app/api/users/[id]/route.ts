import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;
    const body: any = await request.json();

    // Check if user exists in DB — if not, return success (LocalStorage handles it)
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      // User only in LocalStorage, frontend already updated it — just acknowledge
      return NextResponse.json({
        success: true,
        data: { id, name: body.name, email: body.email, password: body.password },
        localOnly: true,
      });
    }

    const updateData: any = {
      name: body.name,
      email: body.email,
    };

    // Only update password if provided and non-empty
    if (body.password !== undefined && body.password !== '') {
      updateData.password = body.password;
    }

    // Validate roleId exists in DB before linking (FK safety)
    if (body.roleId) {
      const roleExists = await prisma.role.findUnique({ where: { id: body.roleId } });
      if (roleExists) {
        updateData.roleId = body.roleId;
      }
    }

    // Validate sectionId exists in DB before linking (FK safety)
    if (body.sectionId) {
      const sectionExists = await prisma.section.findUnique({ where: { id: body.sectionId } });
      if (sectionExists) {
        updateData.sectionId = body.sectionId;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
        section: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}



export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
