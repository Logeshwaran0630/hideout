"use client";

import { useEffect, useState } from "react";
import { Calendar, Flag, HelpCircle, MessageCircle, Send, Trophy, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876543210";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  message: string;
}

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [userHId, setUserHId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;

        if (user) {
          setIsLoggedIn(true);

          const { data: profile } = await supabase
            .from("users")
            .select("h_id, display_name")
            .eq("id", user.id)
            .single();

          if (profile) {
            setUserHId(profile.h_id);
            setUserName(profile.display_name || user.email?.split("@")[0] || null);
          }
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    void getUserInfo();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        void getUserInfo();
      } else {
        setIsLoggedIn(false);
        setUserHId(null);
        setUserName(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const generateMessage = (action: string) => {
    const currentHId = userHId
      ? userHId.startsWith("HID-")
        ? userHId
        : `HID-${userHId}`
      : null;

    const baseMessage = `*THE HIDEOUT - BOOKING REQUEST*\n\n`;

    const templates: Record<string, string> = {
      booking: `${baseMessage}${isLoggedIn ? `*H-ID:* ${currentHId}\n\n` : `*Not logged in* - Please sign up at hideout.vercel.app\n\n`}*I want to book:*\n\nExample format:\n${currentHId || "HID-XXXXXX"} [DATE] [TIME] [SESSION]\n\nExamples:\n- ${currentHId || "HID-000001"} tomorrow 7pm duo\n- ${currentHId || "HID-000001"} may 16 8pm squad\n- ${currentHId || "HID-000001"} friday 3pm solo\n\n--------------------\n\n*My booking:*\n${currentHId || "HID-______"} ________ __ __\n\n--------------------\n\nThe Hideout, Chennai\nOpen 11 AM - Midnight\n\nPlease confirm my booking. Thanks!`,
      example: `${baseMessage}*Example Messages You Can Send:*\n\n1. HID-000001 tomorrow 7pm duo\n2. HID-000001 may 16 8pm squad\n3. HID-000001 friday 3pm solo\n\n--------------------\n\n*Date words:* today, tomorrow, [day name] e.g., monday, [date] e.g., may 16\n\n*Time:* 7pm, 8pm, 3pm, 9pm etc.\n\n*Session:* solo (1 player), duo (2 players), squad (4 players)\n\n--------------------\n\n*Your H-ID:* ${currentHId || "Sign up to get H-ID"}\n\nSend your booking request and we'll confirm!`,
      help: `${baseMessage}*Need Help?*\n\nTo book a slot, send:\n${currentHId || "HID-XXXXXX"} [date] [time] [session]\n\n*Examples:*\n- ${currentHId || "HID-000001"} tomorrow 7pm duo\n- ${currentHId || "HID-000001"} may 16 8pm squad\n- ${currentHId || "HID-000001"} friday 3pm solo\n\n--------------------\n\nVisit our website: hideout.vercel.app\nCall us: +91 XXXXX XXXXX\n\nWe'll respond shortly!`,
      myhid: `${baseMessage}*Your H-ID Information*\n\n${isLoggedIn ? `*Your H-ID:* ${currentHId}\n\nYou can use this ID to book slots:\nSend: ${currentHId} tomorrow 7pm duo\n\n--------------------\n\n*Don't have an H-ID?*\nSign up at hideout.vercel.app\n\nIt's free and takes 1 minute!` : `*You are not logged in*\n\nPlease sign up at hideout.vercel.app to get your unique H-ID.\n\nIt's free and takes 1 minute!\n\nAfter signup, you can book slots via WhatsApp.`}`,
    };

    return templates[action] || templates.booking;
  };

  const quickActions: QuickAction[] = [
    { icon: <Calendar className="h-4 w-4" />, label: "Book a Slot", message: generateMessage("booking") },
    { icon: <HelpCircle className="h-4 w-4" />, label: "How to Book", message: generateMessage("example") },
    { icon: <Flag className="h-4 w-4" />, label: "Need Help?", message: generateMessage("help") },
    { icon: <Trophy className="h-4 w-4" />, label: "My H-ID", message: generateMessage("myhid") },
  ];

  const openWhatsApp = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const widget = document.getElementById("whatsapp-widget-container");
      if (widget && !widget.contains(e.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <>
      <div id="whatsapp-widget-container" className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8">
        {isOpen && (
          <div className="absolute bottom-20 right-0 mb-2 w-72 animate-slide-up overflow-hidden rounded-2xl border border-[#2A2F38] bg-[#14181F] shadow-2xl">
            <div className="border-b border-[#2A2F38] bg-gradient-to-r from-[#25D366]/20 to-[#128C7E]/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Chat with Hideout</h3>
                  <p className="text-xs text-[#A0A6AF]">Typically replies in minutes</p>
                </div>
              </div>
            </div>

            <div className="space-y-1 p-3">
              <p className="px-2 py-1 text-xs text-[#A0A6AF]">Quick messages:</p>
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => openWhatsApp(action.message)}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#0A0F18]"
                >
                  <div className="text-[#25D366]">{action.icon}</div>
                  <span className="text-sm text-white transition-colors group-hover:text-[#25D366]">{action.label}</span>
                </button>
              ))}
            </div>

            <div className="my-1 border-t border-[#2A2F38]" />

            <div className="p-3">
              <button
                onClick={() => openWhatsApp(generateMessage("booking"))}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#20BA58]"
              >
                <Send className="h-4 w-4" />
                Send Custom Message
              </button>
            </div>

            <div className="border-t border-[#2A2F38] bg-[#0A0F18] px-4 py-2 text-center">
              <p className="text-[10px] text-[#A0A6AF]">
                {isLoggedIn ? `Chatting as: ${userHId || userName || "Hideout Player"}` : "Sign in for faster support"}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative group flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 md:h-16 md:w-16 ${
            isOpen ? "bg-[#2A2F38] hover:bg-[#3A3A3A]" : "bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:scale-110"
          }`}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <>
              <MessageCircle className="h-7 w-7 text-white" />
              <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-75" />
              <span className="absolute inset-0 animate-pulse rounded-full bg-[#25D366] opacity-50" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 animate-bounce items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                1
              </span>
            </>
          )}
        </button>

        {!isOpen && isHovered && (
          <div className="absolute bottom-20 right-0 mb-2 whitespace-nowrap rounded-xl border border-[#2A2F38] bg-[#14181F] px-4 py-2 text-sm text-white shadow-lg animate-fade-in">
            Book via WhatsApp - Send H-ID + Date + Time + Session
            <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 border-b border-r border-[#2A2F38] bg-[#14181F]" />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }
      `}</style>
    </>
  );
}
