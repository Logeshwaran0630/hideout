import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cancelCalendarEvent } from '@/lib/googleCalendar';
import { sendBookingCancellationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, time_slots(*), session_types(*), users(*)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

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

    const userProfile = booking.users ?? {
      id: booking.user_id,
      email: booking.users?.email ?? '',
      display_name: booking.users?.display_name ?? null,
      h_id: booking.users?.h_id ?? undefined,
    };

    await sendBookingCancellationEmail({
      ...booking,
      users: userProfile,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin cancellation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}