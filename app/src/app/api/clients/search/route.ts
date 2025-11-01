import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, organization_name, contact_person, email, phone')
      .or(`organization_name.ilike.%${query}%,contact_person.ilike.%${query}%`)
      .eq('is_active', true)
      .order('organization_name')
      .limit(10);

    if (error) {
      console.error('Error searching clients:', error);
      return NextResponse.json(
        { error: 'Failed to search clients' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: clients || [] });
  } catch (error) {
    console.error('Error in client search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
