"use client";

import { useState, useEffect } from "react";

const gamingTips = [
  "🎮 Did you know? The Hideout has 4K 120Hz displays on all PS5 stations!",
  "🕹️ Pro tip: Book Duo sessions to get the best value with a friend!",
  "🏆 Earn H Coins with every booking - 100 coins = 1 FREE session!",
  "🎧 Our headsets are noise-cancelling for the ultimate immersion!",
  "⚡ All consoles are pre-loaded with the latest games - no waiting!",
  "🎯 Squad up! 4-player sessions get 25 H Coins per booking!",
  "🕐 We're open till midnight - perfect for late-night gaming sessions!",
  "🎮 50+ game titles available across PS5, PS4, Arcade and Racing Sim!",
  "💬 Need help? Use the WhatsApp button - we reply in minutes!",
  "🌟 The Hideout - Chennai's premier after-hours gaming lounge!",
  "🎲 Bring your squad - we have tournament mode ready!",
  "🎵 7.1 surround sound headsets available for the best audio experience!",
  "🪑 Premium gaming chairs for maximum comfort during long sessions!",
  "📅 Book in advance - weekends fill up fast!",
  "🎮 Pro controllers available for competitive gaming!",
];

const randomTips = [
  "Checking available slots...",
  "Scanning Google Calendar...",
  "Finding the best time for you...",
  "Locking in your slot...",
  "Almost there...",
  "Preparing your gaming station...",
];

export default function GamingLoader() {
  const [tipIndex, setTipIndex] = useState(0);
  const [randomTipIndex, setRandomTipIndex] = useState(0);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTipIndex((p) => (p + 1) % gamingTips.length), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setRandomTipIndex((p) => (p + 1) % randomTips.length), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setFrame((p) => (p + 1) % 4), 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative w-32 h-32 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-[#2A2A2A]" />
        <div className="absolute inset-0 rounded-full border-4 border-t-[#A855F7] border-r-[#06B6D4] border-b-[#EC4899] border-l-transparent joystick-spin" />

        <div className="absolute inset-0 flex items-center justify-center">
          {frame === 0 && (
            <svg className="w-12 h-12 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
          {frame === 1 && (
            <svg className="w-12 h-12 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.5-4.5M15 10H9m6 0v6m0-6l4.5 4.5M9 10H4.5M9 10v6m0-6L4.5 4.5" />
            </svg>
          )}
          {frame === 2 && (
            <svg className="w-12 h-12 text-[#EC4899]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
          {frame === 3 && (
            <svg className="w-12 h-12 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
      </div>

      <p className="text-[#A855F7] font-medium text-lg mb-2 animate-pulse-text">{randomTips[randomTipIndex]}</p>

      <div className="mt-4 max-w-md text-center">
        <div className="bg-[#18181B] border border-[#A855F7]/20 rounded-xl p-4">
          <p className="text-xs text-[#A1A1AA] mb-1">🎲 GAMING TIP</p>
          <p className="text-sm text-white">{gamingTips[tipIndex]}</p>
        </div>
      </div>
    </div>
  );
}
