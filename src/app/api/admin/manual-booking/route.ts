import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createCalendarEvent } from '@/lib/googleCalendar';
import { sendAdminAlertEmail, sendBookingConfirmationEmail } from '@/lib/email';

function generateUuid() {
  return crypto.randomUUID();
}

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
    const { hId, customerPhone, customerEmail, customerName, bookingDate, timeSlotId, sessionTypeId, setupId, notes, createNew, paymentMode, totalPrice } = body;

    let userData: any = null;

    if (createNew) {
      if (!customerName) {
        return NextResponse.json({ error: 'Customer name is required for new customer' }, { status: 400 });
      }

      if (!customerEmail) {
        return NextResponse.json({ error: 'Email address is required for new customer' }, { status: 400 });
      }

      // Generate a unique H-ID (HID-######)
      let newHid = '';
      for (let i = 0; i < 10; i++) {
        newHid = 'HID-' + String(Math.floor(100000 + Math.random() * 900000));
        const { data: existing } = await supabase.from('users').select('id').eq('h_id', newHid).maybeSingle();
        if (!existing) break;
      }

      const defaultPassword = 'hideout@123';

      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: customerEmail,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          display_name: customerName,
          phone: customerPhone || null,
        },
      });

      if (createUserError) {
        console.error('Admin create user error:', createUserError);
        return NextResponse.json({ error: createUserError.message }, { status: 500 });
      }

      if (!newUser?.user) {
        return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
      }

      const { data: insertedUser, error: insertErr } = await supabase.from('users').upsert({
        id: newUser.user.id,
        h_id: newHid,
        email: customerEmail,
        display_name: customerName,
        phone: customerPhone || null,
        role: 'user',
      }, { onConflict: 'id' }).select().single();

      if (insertErr) {
        console.error('User insert error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      userData = {
        ...insertedUser,
        h_id: insertedUser?.h_id || newHid,
      };
    } else {
      const lookupValue = (hId || customerPhone || '').trim();
      if (!lookupValue) {
        return NextResponse.json({ error: 'H-ID or phone number is required' }, { status: 400 });
      }

      let userQuery = supabase
        .from('users')
        .select('id, h_id, display_name, email, phone');

      if (lookupValue.toUpperCase().startsWith('HID-')) {
        userQuery = userQuery.eq('h_id', lookupValue.toUpperCase());
      } else {
        const digits = lookupValue.replace(/\D/g, '');
        userQuery = userQuery.or(`phone.eq.${lookupValue},phone.eq.${digits}`);
      }

      const { data: userResult } = await userQuery.maybeSingle();

      if (!userResult) {
        return NextResponse.json({ 
          error: `Customer not found. Please ask customer to sign up first or use a valid H-ID / phone number.` 
        }, { status: 404 });
      }

      userData = userResult;
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
    
    // Check if slot is already booked for the selected setup
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('time_slot_id', timeSlotId)
      .eq('booking_date', bookingDate)
      .eq('setup_id', setupId || null)
      .maybeSingle();
    
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
    
    const bookingPrice = totalPrice ?? sessionType.price_per_hour;

    // Create Google Calendar event
    const calendarEventId = await createCalendarEvent({
      summary: `Hideout Booking - ${userData.display_name || userData.email} (${userData.h_id})`,
      description: `
Customer: ${userData.display_name || userData.email}
H-ID: ${userData.h_id}
Session: ${sessionType.name}
Players: ${sessionType.max_players}
  Price: Rs. ${bookingPrice}
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
        setup_id: setupId || null,
        time_slot_id: timeSlotId,
        session_type_id: sessionTypeId,
        booking_date: bookingDate,
        player_count: sessionType.max_players,
        total_price: bookingPrice,
        calendar_event_id: calendarEventId,
        payment_mode: paymentMode || 'cash',
        payment_status: 'paid',
        status: 'confirmed',
        notes: `Manual booking\n${notes || ''}`
      })
      .select()
      .single();
    
    if (bookingError) {
      console.error('Booking error:', bookingError);
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    if (setupId) {
      await supabase.from('setup_status').upsert({
        setup_id: setupId,
        status: 'booked',
        current_booking_id: booking.id,
        updated_at: new Date().toISOString(),
      });
    }
    
    // Award H Coins
    if (sessionType.h_coins_earned > 0) {
      await supabase.from('h_coin_ledger').insert({
        user_id: userData.id,
        amount: sessionType.h_coins_earned,
        type: 'earn',
        reference_id: booking.id,
        description: `Manual booking: ${booking.booking_code}`
      });
    }

    await Promise.all([
      sendBookingConfirmationEmail({
        ...booking,
        users: userData,
      } as any).catch(() => false),
      sendAdminAlertEmail({
        ...booking,
        users: userData,
      } as any).catch(() => false),
    ]);
    
    // Generate WhatsApp confirmation message
    const whatsappMessage = `
*THE HIDEOUT - BOOKING CONFIRMED*

Booking Code: *${booking.booking_code}*
H-ID: ${userData.h_id}
Customer: ${userData.display_name || userData.email}
Email: ${userData.email}
Password: hideout@123
Date: ${new Date(bookingDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
Time: ${timeSlot.label}
Session: *${sessionType.name}* (${sessionType.max_players} player${sessionType.max_players > 1 ? 's' : ''})
Price: Rs. ${sessionType.price_per_hour}

${sessionType.h_coins_earned > 0 ? `H Coins earned: +${sessionType.h_coins_earned}\n` : ''}

Show this code at the counter.
The Hideout, Chennai
Open 11 AM - Midnight

See you at The Hideout!
    `.trim();
    
    return NextResponse.json({
      success: true,
      booking: {
        booking_code: booking.booking_code,
        hId: userData.h_id,
        customerName: userData.display_name || userData.email,
        date: bookingDate,
        timeSlot: timeSlot.label,
        sessionType: sessionType.name,
        price: bookingPrice,
        coinsEarned: sessionType.h_coins_earned
      },
      whatsappMessage
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
