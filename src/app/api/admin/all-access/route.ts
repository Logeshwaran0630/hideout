import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: settings, error } = await supabase
      .from('all_access_settings')
      .select('*')
      .order('duration_minutes');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { durationMinutes, price, hCoinsEarned } = body;

    const { error } = await supabase
      .from('all_access_settings')
      .update({ price, h_coins_earned: hCoinsEarned, updated_at: new Date().toISOString() })
      .eq('duration_minutes', durationMinutes);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
