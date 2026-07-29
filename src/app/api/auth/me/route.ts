import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Default to Super Admin if no userId provided
    let user;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: true,
          section: true,
          projectMembers: {
            include: { project: true },
          },
        },
      });
    }

    if (!user) {
      user = await prisma.user.findFirst({
        where: { role: { key: 'SUPER_ADMIN' } },
        include: {
          role: true,
          section: true,
          projectMembers: {
            include: { project: true },
          },
        },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
