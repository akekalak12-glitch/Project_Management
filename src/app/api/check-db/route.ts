export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const d1Exists = !!(process.env as any).DB;
    let userCount = 0;
    let usersList: any[] = [];
    let dbErrorDetail = null;

    try {
      usersList = await prisma.user.findMany({
        take: 5,
        select: { id: true, email: true, name: true }
      });
      userCount = usersList.length;
    } catch (dbError: any) {
      dbErrorDetail = {
        message: dbError.message,
        stack: dbError.stack
      };
    }

    return NextResponse.json({
      success: true,
      message: "Diagnostics page",
      d1Exists,
      dbStatus: dbErrorDetail ? "DATABASE_ERROR" : "CONNECTED",
      dbError: dbErrorDetail,
      userCount,
      sampleUsers: usersList
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "General error in check-db",
      error: error.message
    });
  }
}
