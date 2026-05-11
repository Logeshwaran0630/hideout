import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const hId = searchParams.get('hId');
    
    if (!hId) {
      return NextResponse.json({ error: 'H-ID required' }, { status: 400 });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, h_id, display_name, email')
      .eq('h_id', hId.toUpperCase())
      .single();
    
    if (error || !user) {
      return NextResponse.json({ user: null });
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
