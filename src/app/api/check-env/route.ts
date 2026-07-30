export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
  try {
    let d1BindingFound = false;
    let d1Error = null;

    try {
      const { env } = getCloudflareContext();
      d1BindingFound = !!(env && (env as unknown as { DB?: unknown }).DB);
    } catch (e: any) {
      d1Error = e.message;
    }

    return NextResponse.json({
      success: true,
      runtime: 'workerd (opennext)',
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
