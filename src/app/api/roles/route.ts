export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { SEED_ROLES } from '@/lib/data-store';

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { permissionLevel: 'desc' },
    });
    return NextResponse.json({ success: true, data: roles });
  } catch (error: any) {
    console.warn('Fallback to SEED_ROLES due to D1 edge binding status:', error);
    return NextResponse.json({ success: true, data: SEED_ROLES });
  }
}
