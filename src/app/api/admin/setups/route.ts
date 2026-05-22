import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: setups, error } = await supabase
      .from('setups')
      .select('*')
      .order('sort_order');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ setups });
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
    const { setupId, isActive, maintenanceReason } = body;

    if (!setupId) {
      return NextResponse.json({ error: 'Setup ID required' }, { status: 400 });
    }

    // First check if setup exists
    const { data: existingSetup, error: fetchError } = await supabase
      .from('setups')
      .select('id, is_active')
      .eq('id', setupId)
      .single();

    if (fetchError || !existingSetup) {
      return NextResponse.json({ error: 'Setup not found' }, { status: 404 });
    }

    // Update the setup
    const { error: updateError } = await supabase
      .from('setups')
      .update({
        is_active: isActive,
        maintenance_reason: maintenanceReason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', setupId);

    if (updateError) {
      console.error('Setup update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Return the updated setup
    const { data: updatedSetup } = await supabase
      .from('setups')
      .select('*')
      .eq('id', setupId)
      .single();

    return NextResponse.json({ success: true, setup: updatedSetup });
  } catch (err) {
    console.error('Setup API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
