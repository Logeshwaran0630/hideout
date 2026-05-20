import { NextResponse } from 'next/server';
import { cancelCalendarEvent } from '@/lib/googleCalendar';
import { sendBookingCancellationEmail } from '@/lib/email';
import type { Booking, User } from '@/lib/emailService';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function getBookingDateTime(bookingDate: string, startTime?: string | null) {
  if (!startTime) {
    return null;
  }

  const normalizedTime = startTime.slice(0, 5);
  const bookingDateTime = new Date(`${bookingDate}T${normalizedTime}:00+05:30`);

  return Number.isNaN(bookingDateTime.getTime()) ? null : bookingDateTime;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
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
      .select('id, booking_code, booking_date, status, total_price, calendar_event_id, setup_id, user_id, time_slots(start_time, label, end_time), session_types(name, h_coins_earned), users(id, email, display_name, h_id)')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking already cancelled' }, { status: 400 });
    }

    const bookingTime = getBookingDateTime(booking.booking_date, booking.time_slots?.[0]?.start_time);

    if (!bookingTime) {
      return NextResponse.json({ error: 'Unable to determine booking time' }, { status: 400 });
    }

    const now = new Date();

    if (bookingTime.getTime() <= now.getTime()) {
      return NextResponse.json({ error: 'Only upcoming bookings can be cancelled' }, { status: 400 });
    }

    const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isLateCancellation = hoursUntilBooking < 2;
    const refundAmount = isLateCancellation ? 0 : booking.session_types?.[0]?.h_coins_earned ?? 0;

    const userProfile: User = booking.users?.[0] ?? {
      id: user.id,
      email: user.email ?? '',
      display_name: user.user_metadata?.display_name ?? user.email ?? null,
      h_id: null,
    };

    if (booking.calendar_event_id) {
      const calendarCancelled = await cancelCalendarEvent(booking.calendar_event_id);

      if (!calendarCancelled) {
        console.error('Calendar event deletion failed for booking:', booking.booking_code);
      }
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
      })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (booking.setup_id) {
      await supabase.from('setup_status').upsert({
        setup_id: booking.setup_id,
        status: 'available',
        current_booking_id: null,
        occupied_since: null,
        updated_at: new Date().toISOString(),
      });
    }

    if (refundAmount > 0) {
      const { error: ledgerError } = await supabase
        .from('h_coin_ledger')
        .insert({
          user_id: booking.user_id,
          amount: -refundAmount,
          type: 'refund',
          reference_id: booking.id,
          description: `Cancellation refund for booking ${booking.booking_code}`,
        });

      if (ledgerError) {
        console.error('Refund ledger insert failed:', ledgerError);
      }
    }

    const cancellationEmailBooking: Booking & { refundAmount?: number } = {
      id: booking.id,
      booking_code: booking.booking_code,
      booking_date: booking.booking_date,
      total_price: booking.total_price,
      time_slots: booking.time_slots?.[0] ?? null,
      session_types: booking.session_types?.[0] ?? null,
      users: userProfile,
      refundAmount,
    };

    await sendBookingCancellationEmail(cancellationEmailBooking);

    return NextResponse.json({
      success: true,
      message: isLateCancellation
        ? 'Booking cancelled. No H Coins refunded because the cancellation was within 2 hours of the booking time.'
        : `Booking cancelled. ${refundAmount} H Coins refunded.`,
      refundAmount,
      lateCancellation: isLateCancellation,
    });
  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}