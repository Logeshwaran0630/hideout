"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Calendar, HelpCircle, Flag, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// Replace with actual Hideout WhatsApp number (include country code, no + or spaces)
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876543210";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  key: string;
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

  // Get current page URL and title
  const getCurrentPageInfo = () => {
    if (typeof window === "undefined") return { url: "", path: "", pageName: "The Hideout" };
    
    const url = window.location.href;
    const path = window.location.pathname;
    
    let pageName = "The Hideout";
    if (path === "/") pageName = "Homepage";
    else if (path === "/slots") pageName = "Slot Booking";
    else if (path === "/profile") pageName = "My Profile";
    else if (path.startsWith("/admin")) pageName = "Admin Panel";
    else if (path === "/login") pageName = "Login/Signup";
    
    return { url, path, pageName };
  };

  // Generate WhatsApp message based on action
  const generateMessage = (action: string) => {
    const { url, pageName } = getCurrentPageInfo();
    const timestamp = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const baseMessage = `Hi Hideout Team,\n\n`;
    
    const templates: Record<string, string> = {
      booking: `${baseMessage}I would like to book a slot at The Hideout.\n\nDate: \nTime: \nSession Type: \n\n${
        isLoggedIn ? `H-ID: ${userHId}\n` : `Note: I will sign up before booking.\n`
      }\nPage: ${pageName}\nTime Sent: ${timestamp}\n\nPlease confirm availability.\n\nThank you.`,
      
      question: `${baseMessage}I have a question about The Hideout.\n\nQuestion:\n\n${
        isLoggedIn ? `H-ID: ${userHId}\n` : `Status: Not logged in yet\n`
      }Page: ${pageName}\nTime Sent: ${timestamp}\n\nPlease respond at your earliest convenience.`,
      
      issue: `${baseMessage}I am experiencing an issue.\n\nIssue Description:\n\n${
        isLoggedIn ? `H-ID: ${userHId}\n` : `Status: Not logged in\n`
      }Page: ${pageName}\nURL: ${url}\nTime: ${timestamp}\n\nPlease help resolve this issue.`,
      
      tournament: `${baseMessage}I am interested in tournaments at The Hideout.\n\nGame Interested In: \nTeam Size: \n\n${
        isLoggedIn ? `H-ID: ${userHId}\n` : `Status: Will create account\n`
      }Page: ${pageName}\nTime Sent: ${timestamp}\n\nPlease share the tournament schedule and prize details.`,
    };
    
    return templates[action] || templates.booking;
  };

  // Quick action buttons
  const quickActions: QuickAction[] = [
    { 
      icon: <Calendar className="w-4 h-4" />, 
      label: "Book a Slot", 
      key: "booking"
    },
    { 
      icon: <HelpCircle className="w-4 h-4" />, 
      label: "Ask Question", 
      key: "question"
    },
    { 
      icon: <Flag className="w-4 h-4" />, 
      label: "Report Issue", 
      key: "issue"
    },
    { 
      icon: <Trophy className="w-4 h-4" />, 
      label: "Tournament", 
      key: "tournament"
    },
  ];

  // Open WhatsApp with message
  const openWhatsApp = (action: string) => {
    const message = generateMessage(action);
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
                  key={action.key}
                  onClick={() => openWhatsApp(action.key)}
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
                onClick={() => openWhatsApp("booking")}
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
            Chat with us on WhatsApp
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
