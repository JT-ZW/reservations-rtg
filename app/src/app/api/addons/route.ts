import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/api/utils';

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: addons, error } = await supabase
      .from('addons')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json(addons);
  } catch (error) {
    console.error('Addons list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addons' },
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

    // Check if user is admin or manager
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, rate, unit } = body;

    if (!name || !rate) {
      return NextResponse.json(
        { error: 'Name and rate are required' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const { data: existing } = await supabase
      .from('addons')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Add-on with this name already exists' },
        { status: 400 }
      );
    }

    const { data: newAddon, error } = await supabase
      .from('addons')
      .insert({
        name,
        description: description || null,
        rate,
        unit: unit || 'unit',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newAddon, { status: 201 });
  } catch (error) {
    console.error('Create addon error:', error);
    return NextResponse.json(
      { error: 'Failed to create addon' },
      { status: 500 }
    );
  }
}
