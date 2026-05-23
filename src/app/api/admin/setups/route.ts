import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: setups, error } = await supabase
      .from('setups')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('GET setups error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { setups },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err) {
    console.error('GET setups catch:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { setupId, isActive } = body;

    if (!setupId) {
      return NextResponse.json({ error: 'Setup ID required' }, { status: 400 });
    }

    const { data: updatedRows, error } = await supabase
      .from('setups')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', setupId)
      .select();

    if (error) {
      console.error('PUT setups error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, setup: updatedRows?.[0] ?? null });
  } catch (err) {
    console.error('Setup API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
