'use server';

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function toggleSetupStatus(setupId: string, isActive: boolean) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'admin') {
      return { success: false, error: 'Forbidden' };
    }

    const { error } = await supabase
      .from('setups')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', setupId);

    if (error) {
      console.error('Update error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/setups');
    revalidatePath('/slots');

    return { success: true };
  } catch (error) {
    console.error('Action error:', error);
    return { success: false, error: 'Internal server error' };
  }
}
