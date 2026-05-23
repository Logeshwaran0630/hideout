import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: settings, error } = await supabase
      .from('all_access_settings')
      .select('*')
      .order('duration_minutes');

    if (error) {
      console.error('GET all-access error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { settings: settings || [] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err) {
    console.error('GET all-access catch:', err);
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
    const { durationMinutes, price, hCoinsEarned, isActive } = body;

    const updateData: Record<string, string | number | boolean | null> = {
      updated_at: new Date().toISOString(),
    };

    if (price !== undefined) updateData.price = price;
    if (hCoinsEarned !== undefined) updateData.h_coins_earned = hCoinsEarned;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { error } = await supabase
      .from('all_access_settings')
      .update(updateData)
      .eq('duration_minutes', durationMinutes);

    if (error) {
      console.error('PUT all-access error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT all-access catch:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
