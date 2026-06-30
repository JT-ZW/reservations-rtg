import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/api/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit, extractRequestContext } from '@/lib/audit/audit-logger';

export async function POST(
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

    // Get the target user's details
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Resend invitation using admin client
    const adminClient = createAdminClient();
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/set-password`;
    
    console.log('Resending invitation to:', targetUser.email);
    console.log('User ID:', id);
    console.log('Redirect URL:', redirectUrl);
    
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      targetUser.email,
      {
        redirectTo: redirectUrl,
        data: {
          full_name: targetUser.full_name,
          role: targetUser.role,
          phone: targetUser.phone || null,
        },
      }
    );

    if (inviteError) {
      console.error('Resend invitation error:', inviteError);
      console.error('Error details:', JSON.stringify(inviteError, null, 2));
      return NextResponse.json(
        { error: inviteError.message || 'Failed to resend invitation' },
        { status: 500 }
      );
    }

    console.log('Invitation resent successfully to:', targetUser.email);

    // Log audit trail
    await logAudit(
      {
        action: 'UPDATE',
        resourceType: 'user',
        resourceId: targetUser.id,
        resourceName: targetUser.full_name,
        description: `Resent invitation email to ${targetUser.full_name} (${targetUser.email})`,
        metadata: {
          email: targetUser.email,
          action_type: 'resend_invitation',
        },
      },
      extractRequestContext(request)
    );

    return NextResponse.json({
      message: 'Invitation email resent successfully',
      email: targetUser.email,
    });
  } catch (error) {
    console.error('Resend invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to resend invitation' },
      { status: 500 }
    );
  }
}
