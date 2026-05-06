import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (user.email?.toLowerCase() !== "admin@hideout.com") redirect("/");

  const profile = {
    role: "admin",
    h_id: "ADMIN",
    display_name: user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? "Admin",
    email: user.email ?? "admin@hideout.com",
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] md:flex">
      <AdminSidebar profile={profile} />
      <main className="flex-1 px-6 py-6 md:px-8 md:py-8 md:pl-72">
        <AdminBreadcrumb />
        {children}
      </main>
    </div>
  );
}
