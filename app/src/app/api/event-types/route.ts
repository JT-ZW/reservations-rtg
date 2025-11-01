import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/api/utils';

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: eventTypes, error } = await supabase
      .from('event_types')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json(eventTypes);
  } catch (error) {
    console.error('Event types list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event types' },
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const { data: existing } = await supabase
      .from('event_types')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Event type with this name already exists' },
        { status: 400 }
      );
    }

    const { data: newEventType, error } = await supabase
      .from('event_types')
      .insert({
        name,
        description: description || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newEventType, { status: 201 });
  } catch (error) {
    console.error('Create event type error:', error);
    return NextResponse.json(
      { error: 'Failed to create event type' },
      { status: 500 }
    );
  }
}
