export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sections = await prisma.section.findMany({
      include: {
        _count: {
          select: { users: true, projects: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: sections });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const section = await prisma.section.create({
      data: {
        name: body.name,
        code: body.code,
        description: body.description,
      },
    });
    return NextResponse.json({ success: true, data: section });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
