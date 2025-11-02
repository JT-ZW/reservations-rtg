import { NextResponse } from 'next/server';
import { logAuthEvent, extractRequestContext } from '@/lib/audit/audit-logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, error } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Log failed login attempt to audit trail
    await logAuthEvent(
      'LOGIN',
      email,
      false,
      extractRequestContext(request),
      error || 'Invalid credentials'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log failed login:', error);
    // Return success anyway - don't block the user flow
    return NextResponse.json({ success: true });
  }
}
