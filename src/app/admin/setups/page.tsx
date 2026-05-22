import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SetupManagement from '@/components/admin/SetupManagement';
import { Construction } from 'lucide-react';

export default async function SetupManagementPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/profile');

  return (
    <div>
      {/* Development Notice Banner */}
      <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
        <Construction className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-yellow-500 font-semibold">Under Development</span>
          <p className="text-sm text-[#A0A6AF] mt-0.5">
            This feature is currently being improved. Some functionality may be limited.
            Use the Price Settings page for complete pricing management.
          </p>
        </div>
      </div>

      {/* Existing Setup Management Component */}
      <SetupManagement />
    </div>
  );
}
