/**
 * Sync existing bookings to Google Calendar
 * 
 * Run this script once to migrate existing bookings to Google Calendar:
 * npx ts-node scripts/sync-to-calendar.ts
 * 
 * This script will:
 * 1. Find all bookings without a calendar_event_id
 * 2. Create a Google Calendar event for each
 * 3. Store the calendar_event_id in the database
 */

import { createClient } from '@supabase/supabase-js';
import { createCalendarEvent } from '../src/lib/googleCalendar';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Booking {
  id: string;
  user_id: string;
  booking_date: string;
  booking_code: string;
  time_slot_id: string;
  session_type_id: string;
  player_count: number;
  total_price: number;
  time_slots?: {
    start_time: string;
    end_time: string;
  };
  session_types?: {
    name: string;
  };
  users?: {
    h_id: string;
    display_name: string | null;
    email: string;
  };
}

async function syncExistingBookings() {
  console.log('Starting sync of existing bookings to Google Calendar...\n');

  try {
    // Fetch all bookings without calendar_event_id
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        booking_date,
        booking_code,
        time_slot_id,
        session_type_id,
        player_count,
        total_price,
        time_slots (start_time, end_time),
        session_types (name),
        users (h_id, display_name, email)
      `)
      .is('calendar_event_id', null)
      .eq('status', 'confirmed');

    if (error) {
      console.error('Error fetching bookings:', error);
      process.exit(1);
    }

    if (!bookings || bookings.length === 0) {
      console.log('No bookings to sync. All bookings already have calendar events.');
      process.exit(0);
    }

    console.log(`Found ${bookings.length} bookings to sync...\n`);

    let successCount = 0;
    let failedCount = 0;

    for (const booking of bookings || []) {
      try {
        const bookingData = booking as unknown as Booking;
        const timeSlots = bookingData.time_slots;
        const sessionType = bookingData.session_types;
        const user = bookingData.users;

        if (!timeSlots || !sessionType || !user) {
          console.log(`❌ Missing related data for booking ${bookingData.booking_code}`);
          failedCount++;
          continue;
        }

        // Parse slot times
        const [startHours, startMinutes] = timeSlots.start_time.split(':');
        const [endHours, endMinutes] = timeSlots.end_time.split(':');

        // Create date objects
        const startDateTime = new Date(bookingData.booking_date);
        startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

        const endDateTime = new Date(bookingData.booking_date);
        endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

        // Create calendar event
        const eventId = await createCalendarEvent({
          summary: `Hideout Booking - ${user.display_name || user.email} (${user.h_id})`,
          description: `
Booking Details:
- Booking Code: ${bookingData.booking_code}
- Session Type: ${sessionType.name}
- Players: ${bookingData.player_count}
- Price: ₹${bookingData.total_price}
- H-ID: ${user.h_id}
- Email: ${user.email}
          `.trim(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        });

        if (!eventId) {
          console.log(`❌ Failed to create event for booking ${bookingData.booking_code}`);
          failedCount++;
          continue;
        }

        // Update booking with calendar_event_id
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ calendar_event_id: eventId })
          .eq('id', bookingData.id);

        if (updateError) {
          console.log(`❌ Failed to update booking ${bookingData.booking_code}: ${updateError.message}`);
          failedCount++;
        } else {
          console.log(`✅ Synced: ${bookingData.booking_code} (${user.h_id})`);
          successCount++;
        }
      } catch (err) {
        console.error(`Error syncing booking:`, err);
        failedCount++;
      }
    }

    console.log(`\nSync Complete:`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`Total: ${bookings.length}`);

    process.exit(failedCount === 0 ? 0 : 1);
  } catch (err) {
    console.error('Sync error:', err);
    process.exit(1);
  }
}

// Run the sync
syncExistingBookings();
