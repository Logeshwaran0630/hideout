"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Calendar, HelpCircle, Flag, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// Replace with actual Hideout WhatsApp number (include country code, no + or spaces)
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

  // Get user info if logged in
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setIsLoggedIn(true);
          
          const { data: profile } = await supabase
            .from("users")
            .select("h_id, display_name")
            .eq("id", user.id)
            .single();
          
          if (profile) {
            setUserHId(profile.h_id);
            setUserName(profile.display_name || user.email?.split('@')[0] || null);
          }
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };
    
    getUserInfo();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        getUserInfo();
      } else {
        setIsLoggedIn(false);
        setUserHId(null);
        setUserName(null);
      }
    });
    
    return () => subscription?.unsubscribe();
  }, []);

  // Generate WhatsApp message based on action
  const generateMessage = (action: string) => {
    const currentHId = userHId
      ? userHId.startsWith("HID-")
        ? userHId
        : `HID-${userHId}`
      : null;

    const baseMessage = `🏠 *THE HIDEOUT - BOOKING REQUEST*\n\n`;

    const templates: Record<string, string> = {
      booking: `${baseMessage}${isLoggedIn ? `🔑 *H-ID:* ${currentHId}\n\n` : `📝 *Not logged in* - Please sign up at hideout.vercel.app\n\n`}📅 *I want to book:*\n\nExample format:\n${currentHId || "HID-XXXXXX"} [DATE] [TIME] [SESSION]\n\nExamples:\n• ${currentHId || "HID-000001"} tomorrow 7pm duo\n• ${currentHId || "HID-000001"} may 16 8pm squad\n• ${currentHId || "HID-000001"} friday 3pm solo\n\n━━━━━━━━━━━━━━━━━━━━\n\n*My booking:*\n${currentHId || "HID-______"} ________ __ __\n\n━━━━━━━━━━━━━━━━━━━━\n\n📍 The Hideout, Chennai\n🕐 Open 11 AM - Midnight\n\nPlease confirm my booking. Thanks!`,

      example: `${baseMessage}📋 *Example Messages You Can Send:*\n\n1. HID-000001 tomorrow 7pm duo\n2. HID-000001 may 16 8pm squad\n3. HID-000001 friday 3pm solo\n\n━━━━━━━━━━━━━━━━━━━━\n\n📅 *Date words:* today, tomorrow, [day name] e.g., monday, [date] e.g., may 16\n\n⏰ *Time:* 7pm, 8pm, 3pm, 9pm etc.\n\n👥 *Session:* solo (1 player), duo (2 players), squad (4 players)\n\n━━━━━━━━━━━━━━━━━━━━\n\n*Your H-ID:* ${currentHId || "Sign up to get H-ID"}\n\nSend your booking request and we'll confirm!`,

      help: `${baseMessage}🆘 *Need Help?*\n\nTo book a slot, send:\n${currentHId || "HID-XXXXXX"} [date] [time] [session]\n\n*Examples:*\n• ${currentHId || "HID-000001"} tomorrow 7pm duo\n• ${currentHId || "HID-000001"} may 16 8pm squad\n• ${currentHId || "HID-000001"} friday 3pm solo\n\n━━━━━━━━━━━━━━━━━━━━\n\n📍 Visit our website: hideout.vercel.app\n📞 Call us: +91 XXXXX XXXXX\n\nWe'll respond shortly!`,

      myhid: `${baseMessage}🔑 *Your H-ID Information*\n\n${isLoggedIn ? `✅ *Your H-ID:* ${currentHId}\n\nYou can use this ID to book slots:\nSend: ${currentHId} tomorrow 7pm duo\n\n━━━━━━━━━━━━━━━━━━━━\n\n📝 *Don't have an H-ID?*\nSign up at hideout.vercel.app\n\nIt's free and takes 1 minute!` : `❌ *You are not logged in*\n\nPlease sign up at hideout.vercel.app to get your unique H-ID.\n\nIt's free and takes 1 minute!\n\nAfter signup, you can book slots via WhatsApp.`}`,
    };
    
    return templates[action] || templates.booking;
  };

  // Quick action buttons
  const quickActions: QuickAction[] = [
    { 
      icon: <Calendar className="w-4 h-4" />, 
      label: "Book a Slot", 
      message: generateMessage("booking")
    },
    { 
      icon: <HelpCircle className="w-4 h-4" />, 
      label: "How to Book", 
      message: generateMessage("example")
    },
    { 
      icon: <Flag className="w-4 h-4" />, 
      label: "Need Help?", 
      message: generateMessage("help")
    },
    { 
      icon: <Trophy className="w-4 h-4" />, 
      label: "My H-ID", 
      message: generateMessage("myhid")
    },
  ];

  // Open WhatsApp with message
  const openWhatsApp = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
    setIsOpen(false);
  };

  // Close panel when clicking outside
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
      {/* WhatsApp Widget Container */}
      <div id="whatsapp-widget-container" className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8">
        {/* Expansion Panel */}
        {isOpen && (
          <div className="absolute bottom-20 right-0 mb-2 w-72 bg-[#18181B] rounded-2xl shadow-2xl border border-[#2A2A2A] overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#25D366]/20 to-[#128C7E]/20 p-4 border-b border-[#2A2A2A]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Chat with Hideout</h3>
                  <p className="text-xs text-[#A1A1AA]">Typically replies in minutes</p>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="p-3 space-y-1">
              <p className="text-xs text-[#A1A1AA] px-2 py-1">Quick messages:</p>
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => openWhatsApp(action.message)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#0A0A0A] transition-colors text-left group"
                >
                  <div className="text-[#25D366]">{action.icon}</div>
                  <span className="text-sm text-white group-hover:text-[#25D366] transition-colors">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Divider */}
            <div className="border-t border-[#2A2A2A] my-1" />
            
            {/* Custom Message */}
            <div className="p-3">
              <button
                onClick={() => openWhatsApp(generateMessage("booking"))}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA58] text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Custom Message
              </button>
            </div>
            
            {/* Footer */}
            <div className="bg-[#0A0A0A] px-4 py-2 text-center border-t border-[#2A2A2A]">
              <p className="text-[10px] text-[#A1A1AA]">
                {isLoggedIn ? `Chatting as: ${userHId || userName || "Hideout Player"}` : "Sign in for faster support"}
              </p>
            </div>
          </div>
        )}
        
        {/* Floating Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            relative group flex items-center justify-center rounded-full shadow-2xl transition-all duration-300
            ${isOpen 
              ? 'bg-[#2A2A2A] hover:bg-[#3A3A3A]' 
              : 'bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:scale-110'
            }
            w-14 h-14 md:w-16 md:h-16
          `}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <MessageCircle className="w-7 h-7 text-white" />
              
              {/* Pulsing ring animation */}
              <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-75" />
              <span className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse opacity-50" />
              
              {/* Notification badge (optional) */}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center animate-bounce font-bold">
                1
              </span>
            </>
          )}
        </button>
        
        {/* Tooltip when hovering */}
        {!isOpen && isHovered && (
          <div className="absolute bottom-20 right-0 mb-2 whitespace-nowrap bg-[#18181B] text-white text-sm px-4 py-2 rounded-xl shadow-lg border border-[#2A2A2A] animate-fade-in">
            💬 Book via WhatsApp — Send H-ID + Date + Time + Session
            <div className="absolute -bottom-1 right-6 w-2 h-2 bg-[#18181B] rotate-45 border-r border-b border-[#2A2A2A]" />
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
