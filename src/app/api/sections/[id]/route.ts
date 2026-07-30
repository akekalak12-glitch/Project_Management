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

    const section = await prisma.section.update({
      where: { id },
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;
    await prisma.section.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
