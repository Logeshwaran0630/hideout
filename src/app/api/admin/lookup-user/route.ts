import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const hId = searchParams.get('hId');
    const query = searchParams.get('query');
    const phone = searchParams.get('phone');
    
    const lookupValue = (query || hId || phone || '').trim();

    if (!lookupValue) {
      return NextResponse.json({ error: 'Lookup value required' }, { status: 400 });
    }

    const normalized = lookupValue.toUpperCase();
    let userQuery = supabase
      .from('users')
      .select('id, h_id, display_name, email, phone');

    if (normalized.startsWith('HID-')) {
      userQuery = userQuery.eq('h_id', normalized);
    } else if (/^[0-9+\-\s]{6,}$/.test(lookupValue)) {
      const digits = lookupValue.replace(/\D/g, '');
      userQuery = userQuery.or(`phone.eq.${lookupValue},phone.eq.${digits}`);
    } else {
      userQuery = userQuery.or(`h_id.eq.${normalized},email.ilike.%${lookupValue}%`);
    }

    const { data: user } = await userQuery.single();

    if (user) {
      return NextResponse.json({ user });
    }

    const digits = lookupValue.replace(/\D/g, '');
    const { data: guestBooking } = await supabase
      .from('bookings')
      .select('guest_phone, guest_name, users (id, h_id, display_name, email, phone)')
      .or(`guest_phone.eq.${lookupValue},guest_phone.eq.${digits}`)
      .not('guest_phone', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ user: guestBooking?.users ?? null });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
