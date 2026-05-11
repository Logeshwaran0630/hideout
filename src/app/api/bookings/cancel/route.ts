import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cancelCalendarEvent } from '@/lib/googleCalendar';
import { sendBookingCancellationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, time_slots(*), session_types(*)')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('id, email, display_name, h_id')
      .eq('id', user.id)
      .single();

    if (booking.calendar_event_id) {
      await cancelCalendarEvent(booking.calendar_event_id);
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await sendBookingCancellationEmail({
      ...booking,
      users: profile ?? {
        id: user.id,
        email: user.email ?? '',
        display_name: user.user_metadata?.display_name ?? user.email ?? undefined,
        h_id: profile?.h_id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}