export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envKeys = Object.keys(process.env);
    const dbType = typeof (process.env as any).DB;
    const hasDB = !!(process.env as any).DB;

    // Check if it is a D1 database by checking for prepare/exec functions
    const isD1 = hasDB && typeof (process.env as any).DB.prepare === 'function';

    return NextResponse.json({
      success: true,
      message: "Environment variables check",
      envKeys,
      dbType,
      hasDB,
      isD1
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Error in check-env",
      error: error.message
    });
  }
}
