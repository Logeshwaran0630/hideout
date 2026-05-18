import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ error: 'Booking code required' }, { status: 400 });
    }
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_code', code.toUpperCase())
      .single();
    
    return NextResponse.json({ exists: !!booking });
  } catch (error) {
    return NextResponse.json({ exists: false });
  }
}
