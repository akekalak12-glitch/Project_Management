export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    let d1BindingFound = false;
    let d1Error = null;

    try {
      const { getRequestContext } = await import('@cloudflare/next-on-pages');
      const ctx = getRequestContext();
      d1BindingFound = !!(ctx && ctx.env && ctx.env.DB);
    } catch (e: any) {
      d1Error = e.message;
    }

    return NextResponse.json({
      success: true,
      runtime: 'edge',
      d1BindingFound,
      d1Error,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
