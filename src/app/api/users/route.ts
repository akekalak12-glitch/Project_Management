export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const roleKey = searchParams.get('roleKey');

    const where: any = {};
    if (sectionId) where.sectionId = sectionId;
    if (roleKey) where.role = { key: roleKey };

    const users = await prisma.user.findMany({
      where,
      include: {
        role: true,
        section: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const avatarSeed = encodeURIComponent(body.name || 'User');

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: body.password || '123456',
        roleId: body.roleId,
        sectionId: body.sectionId || null,
        avatarUrl: body.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
      },
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
