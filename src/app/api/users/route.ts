export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { SEED_USERS } from '@/lib/data-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const roleKey = searchParams.get('roleKey');

    const where: any = {};
    if (sectionId) where.sectionId = sectionId;
    if (roleKey) where.role = { key: roleKey };

    let users: any[] = [];
    try {
      const { prisma } = await import('@/lib/prisma');
      users = await prisma.user.findMany({
        where,
        include: {
          role: true,
          section: true,
        },
        orderBy: { name: 'asc' },
      });
    } catch {
      users = SEED_USERS;
    }

    if (!Array.isArray(users) || users.length === 0) {
      users = SEED_USERS;
    }

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: SEED_USERS });
  }
}

export async function POST(request: Request) {
  try {
    const body: any = await request.json();
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
