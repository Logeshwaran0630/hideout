import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ManualBookingForm from "@/components/admin/ManualBookingForm";

export default async function ManualBookingPage() {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'admin') redirect('/profile');
  
  // Fetch time slots
  const { data: timeSlots } = await supabase
    .from('time_slots')
    .select('*')
    .order('sort_order');
  
  // Fetch session types
  const { data: sessionTypes } = await supabase
    .from('session_types')
    .select('*')
    .order('sort_order');
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Manual Booking</h1>
        <p className="text-[#A1A1AA] mt-2">
          Create booking from WhatsApp message — paste message, auto-fill, confirm
        </p>
      </div>
      
      <ManualBookingForm 
        timeSlots={timeSlots || []} 
        sessionTypes={sessionTypes || []} 
      />
    </div>
  );
}
