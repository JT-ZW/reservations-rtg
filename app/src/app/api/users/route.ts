import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/api/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit, extractRequestContext } from '@/lib/audit/audit-logger';

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or manager
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: users, success: true });
  } catch (error) {
    console.error('Users list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { email, full_name, role, phone, password } = body;

    // Validate required fields
    if (!email || !full_name || !role || !password) {
      return NextResponse.json(
        { error: 'Email, full name, role, and password are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'reservations', 'sales', 'finance', 'auditor'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create auth user first using admin client with service role
    const adminClient = createAdminClient();
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Failed to create auth user' },
        { status: 500 }
      );
    }

    // Create user profile record
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        role,
        phone: phone || null,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      // If profile creation fails, we should delete the auth user
      // but for now just log the error
      console.error('User profile creation error:', error);
      throw error;
    }

    // Log audit trail
    await logAudit(
      {
        action: 'CREATE',
        resourceType: 'user',
        resourceId: newUser.id,
        resourceName: newUser.full_name,
        description: `Created user ${newUser.full_name} (${newUser.email}) with role ${newUser.role}`,
        metadata: {
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          is_active: newUser.is_active,
        },
      },
      extractRequestContext(request)
    );

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
