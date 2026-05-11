import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createCalendarEvent } from '@/lib/googleCalendar';
import { sendAdminAlertEmail, sendBookingConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check admin auth
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
    
    const body = await request.json();
    const { hId, bookingDate, timeSlotId, sessionTypeId, notes } = body;
    
    // Find user by H-ID
    const { data: userData } = await supabase
      .from('users')
      .select('id, h_id, display_name, email')
      .eq('h_id', (hId || '').toUpperCase())
      .single();
    
    if (!userData) {
      return NextResponse.json({ 
        error: `User with H-ID ${hId} not found. Please ask customer to sign up first.` 
      }, { status: 404 });
    }
    
    // Get time slot details
    const { data: timeSlot } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', timeSlotId)
      .single();
    
    // Get session type details
    const { data: sessionType } = await supabase
      .from('session_types')
      .select('*')
      .eq('id', sessionTypeId)
      .single();
    
    if (!timeSlot || !sessionType) {
      return NextResponse.json({ error: 'Invalid slot or session type' }, { status: 400 });
    }
    
    // Check if slot is already booked
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('time_slot_id', timeSlotId)
      .eq('booking_date', bookingDate)
      .single();
    
    if (existingBooking) {
      return NextResponse.json({ error: 'This slot is already booked' }, { status: 409 });
    }
    
    // Parse dates for Google Calendar
    const [startHours, startMinutes] = timeSlot.start_time.split(':');
    const [endHours, endMinutes] = timeSlot.end_time.split(':');
    
    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
    
    const endDateTime = new Date(bookingDate);
    endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
    
    // Create Google Calendar event
    const calendarEventId = await createCalendarEvent({
      summary: `Hideout Booking - ${userData.display_name || userData.email} (${userData.h_id})`,
      description: `
Customer: ${userData.display_name || userData.email}
H-ID: ${userData.h_id}
Session: ${sessionType.name}
Players: ${sessionType.max_players}
Price: ₹${sessionType.price_per_hour}
Notes: ${notes || 'None'}
Booked by: Admin (Manual Booking)
      `.trim(),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    });
    
    // Create booking in Supabase
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userData.id,
        time_slot_id: timeSlotId,
        session_type_id: sessionTypeId,
        booking_date: bookingDate,
        player_count: sessionType.max_players,
        total_price: sessionType.price_per_hour,
        calendar_event_id: calendarEventId,
        status: 'confirmed',
        notes: `Manual booking\n${notes || ''}`
      })
      .select()
      .single();
    
    if (bookingError) {
      console.error('Booking error:', bookingError);
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }
    
    // Award H Coins
    if (sessionType.price_per_hour > 0 && sessionType.h_coins_earned > 0) {
      await supabase.from('h_coin_ledger').insert({
        user_id: userData.id,
        amount: sessionType.h_coins_earned,
        type: 'earn',
        reference_id: booking.id,
        description: `Manual booking: ${booking.booking_code}`
      });
    }

    const bookingForEmail = {
      ...booking,
      users: userData,
    };

    console.log('[Manual Booking API] Sending emails for booking:', booking.booking_code);

    sendBookingConfirmationEmail(bookingForEmail).catch((err) => {
      console.error('[Manual Booking API] Failed to send customer email:', err);
    });

    sendAdminAlertEmail(bookingForEmail).catch((err) => {
      console.error('[Manual Booking API] Failed to send admin email:', err);
    });
    
    // Generate WhatsApp confirmation message
    const whatsappMessage = `
*THE HIDEOUT - BOOKING CONFIRMED* 🎮

Booking Code: *${booking.booking_code}*
H-ID: ${userData.h_id}
Customer: ${userData.display_name || userData.email}
Date: ${new Date(bookingDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
Time: ${timeSlot.label}
Session: *${sessionType.name}* (${sessionType.max_players} player${sessionType.max_players > 1 ? 's' : ''})
Price: ₹${sessionType.price_per_hour}

${sessionType.h_coins_earned > 0 ? `✨ H Coins earned: +${sessionType.h_coins_earned}\n` : ''}

📍 Show this code at the counter.
📍 The Hideout, Chennai
🕐 Open 11 AM - Midnight

See you at The Hideout! 🎮
    `.trim();
    
    return NextResponse.json({
      success: true,
      booking: {
        code: booking.booking_code,
        hId: userData.h_id,
        customerName: userData.display_name || userData.email,
        date: bookingDate,
        timeSlot: timeSlot.label,
        sessionType: sessionType.name,
        price: sessionType.price_per_hour,
        coinsEarned: sessionType.h_coins_earned
      },
      whatsappMessage
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
