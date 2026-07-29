export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET() {
  return new Response(JSON.stringify({ status: "ok", time: new Date().toISOString() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
