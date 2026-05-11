import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendBookingReminderEmail } from '@/lib/emailService';

// This endpoint will be called by a cron job daily
export async function GET(request: Request) {
  // Verify cron secret (for security)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  // Get bookings scheduled for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      users (*),
      time_slots (*),
      session_types (*)
    `)
    .eq('booking_date', tomorrowStr)
    .eq('status', 'confirmed');

  if (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send reminders
  let sentCount = 0;
  for (const booking of bookings || []) {
    await sendBookingReminderEmail(booking);
    sentCount++;
  }

  return NextResponse.json({
    success: true,
    remindersSent: sentCount,
  });
}
