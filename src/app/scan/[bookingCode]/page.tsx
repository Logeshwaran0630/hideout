import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ScanBookingClient from '@/components/admin/ScanBookingClient';

export default async function ScanBookingPage({ params }: { params: Promise<{ bookingCode: string }> }) {
  const { bookingCode } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminUser?.role !== 'admin') {
    redirect('/profile');
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select(
      `
      id,
      booking_code,
      booking_date,
      total_price,
      payment_status,
      payment_mode,
      users (id, h_id, display_name, email),
      time_slots (label, start_time, end_time),
      session_types (name, max_players, h_coins_earned),
      setups (display_name, badge)
    `
    )
    .eq('booking_code', bookingCode.toUpperCase())
    .single();

  if (!booking) {
    notFound();
  }

  return <ScanBookingClient booking={booking} />;
}
