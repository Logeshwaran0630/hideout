import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CircleDollarSign,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Search,
  Settings,
  Ticket,
  Users,
} from "lucide-react";

export default async function AdminHelpPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/profile");
  }

  const sections = [
    {
      title: "Dashboard Overview",
      icon: LayoutDashboard,
      description: "The main dashboard shows key metrics and today's activities.",
      items: [
        "Today's Revenue - Total payments collected today",
        "Pending Payments - Bookings awaiting payment",
        "Completed Bookings - Total paid bookings",
        "Cash Collected - Payments made via cash",
        "UPI Collected - Payments made via UPI",
      ],
    },
    {
      title: "Find Booking",
      icon: Search,
      description: "Quickly find a booking by entering the booking code.",
      steps: [
        "Go to Find Booking",
        "Enter booking code, for example HBK-001027 or 001027",
        "Click search",
        "Mark payment as Cash or UPI",
      ],
    },
    {
      title: "Daily Report",
      icon: FileText,
      description: "Generate and export daily payment reports.",
      steps: [
        "Click Daily Report on dashboard",
        "View summary of today's payments",
        "Download CSV for records",
        "Print report if needed",
      ],
    },
    {
      title: "Manage Bookings",
      icon: CalendarDays,
      description: "View and manage all bookings.",
      items: [
        "View all bookings with filters",
        "Cancel bookings if needed",
        "Search by customer name or booking code",
        "Export bookings data",
      ],
    },
    {
      title: "Manage Users",
      icon: Users,
      description: "View and manage customer accounts.",
      items: [
        "View all registered users",
        "See user H-ID and booking history",
        "Adjust H Coin balances manually",
      ],
    },
    {
      title: "H Coin Management",
      icon: CircleDollarSign,
      description: "Monitor and adjust H Coin balances.",
      items: [
        "View transaction ledger",
        "Add or deduct H Coins for users",
        "Track earn and redeem history",
      ],
    },
    {
      title: "Settings",
      icon: Settings,
      description: "Review admin system configuration.",
      items: [
        "Verify Google Calendar connection",
        "Check booking system settings before peak hours",
        "Keep admin-only changes limited to authorized staff",
      ],
    },
  ];

  const workflowSteps = [
    {
      title: "Customer Books Online",
      description: "Customer selects setup, session, date and time, then confirms booking.",
    },
    {
      title: "Booking Confirmed",
      description: "System sends confirmation email with a QR code ticket.",
    },
    {
      title: "Customer Arrives",
      description: "Customer shows booking code or gives phone number.",
    },
    {
      title: "Staff Finds Booking",
      description: "Go to Find Booking and enter the booking code.",
    },
    {
      title: "Mark Payment",
      description: "Select Cash or UPI to mark booking as paid.",
    },
    {
      title: "Customer Plays",
      description: "Customer enjoys their gaming session.",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-[#FF4500]" />
          <h1 className="text-3xl font-bold text-white">Admin Instruction</h1>
        </div>
        <p className="text-[#A0A6AF]">Complete guide to managing The Hideout booking system</p>
      </div>

      <div className="mb-8 rounded-2xl border border-[#FF4500]/20 bg-gradient-to-r from-[#FF4500]/10 to-[#FF4500]/10 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Quick Reference</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["1", "Find Booking", "Enter code, mark paid"],
            ["2", "Daily Report", "Download CSV or print"],
            ["3", "Manage Bookings", "View, search, cancel"],
            ["4", "H Coins", "Adjust user balances"],
          ].map(([number, title, description]) => (
            <div key={title} className="text-center">
              <div className="text-2xl font-bold text-[#FF4500]">{number}</div>
              <div className="text-sm text-white">{title}</div>
              <div className="text-xs text-[#A0A6AF]">{description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-[#2A2F38] bg-[#14181F] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Ticket className="h-5 w-5 text-[#FF4500]" />
          <h2 className="text-xl font-bold text-white">Standard Workflow</h2>
        </div>
        <div className="space-y-4">
          {workflowSteps.map((step, index) => (
            <div key={step.title} className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF4500] text-sm font-bold text-white">
                {index + 1}
              </div>
              <div>
                <div className="font-medium text-white">{step.title}</div>
                <div className="text-sm text-[#A0A6AF]">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="rounded-2xl border border-[#2A2F38] bg-[#14181F] p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF4500]/10">
                  <Icon className="h-5 w-5 text-[#FF4500]" />
                </div>
                <h3 className="text-lg font-bold text-white">{section.title}</h3>
              </div>
              <p className="mb-3 text-sm text-[#A0A6AF]">{section.description}</p>
              {"items" in section ? (
                <ul className="list-inside list-disc space-y-1 text-sm text-[#A0A6AF]">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {"steps" in section ? (
                <ol className="list-inside list-decimal space-y-1 text-sm text-[#A0A6AF]">
                  {section.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6">
        <h3 className="mb-3 text-lg font-bold text-white">Important Notes</h3>
        <ul className="list-inside list-disc space-y-2 text-sm text-[#A0A6AF]">
          <li>Bookings must be marked as paid after customer pays at counter.</li>
          <li>H Coins are automatically awarded when booking is confirmed.</li>
          <li>Cancelled bookings do not award H Coins.</li>
          <li>Google Calendar sync happens automatically on booking.</li>
          <li>Customers receive email confirmation for all bookings.</li>
          <li>Manual bookings from WhatsApp can be created in Manual Booking.</li>
        </ul>
      </div>
    </div>
  );
}
