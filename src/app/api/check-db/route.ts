export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    let d1Found = false;
    let userCount = 0;
    let sampleUsers: any[] = [];
    let errMessage = null;

    try {
      const { getRequestContext } = await import('@cloudflare/next-on-pages');
      const ctx = getRequestContext();
      if (ctx && ctx.env && ctx.env.DB) {
        d1Found = true;
        const db = ctx.env.DB;
        const stmt = db.prepare("SELECT id, name, email FROM User LIMIT 5");
        const res = await stmt.all();
        sampleUsers = res.results || [];
        userCount = sampleUsers.length;
      }
    } catch (e: any) {
      errMessage = e.message;
    }

    return NextResponse.json({
      success: true,
      d1Found,
      userCount,
      sampleUsers,
      errMessage,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
