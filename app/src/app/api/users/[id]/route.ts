import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/api/utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: targetUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { full_name, role, phone, is_active } = body;

    // Validate role if provided
    if (role && !['admin', 'reservations', 'sales', 'finance', 'auditor'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Only admin can change roles
    if (role && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can change user roles' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    if (full_name !== undefined) updateData.full_name = full_name;
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Don't allow deleting self
    if (id === user.id) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    const { data, error } = await supabase
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'User deactivated successfully', user: data });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}
