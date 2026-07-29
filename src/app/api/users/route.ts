export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { SEED_USERS } from '@/lib/data-store';

export async function GET(request: Request) {
  try {
    return NextResponse.json({ success: true, data: SEED_USERS });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: SEED_USERS });
  }
}

export async function POST(request: Request) {
  try {
    const body: any = await request.json();
    const avatarSeed = encodeURIComponent(body.name || 'User');
    const newUser = {
      id: `user-${Date.now()}`,
      name: body.name,
      email: body.email,
      roleId: body.roleId || '732ce5ba-a573-4dd4-9543-a8989554c69a',
      sectionId: body.sectionId || '87eddf4e-7d77-4caf-acc5-9e4e1e2d5f22',
      avatarUrl: body.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
    };
    return NextResponse.json({ success: true, data: newUser });
  } catch (error: any) {
    return NextResponse.json({ success: true });
  }
}
