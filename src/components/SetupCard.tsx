"use client";

import { Check, Gamepad2, Gauge, Joystick } from "lucide-react";

export interface Setup {
  id: string;
  name: string;
  display_name: string;
  badge: string | null;
  description: string | null;
  icon?: string | null;
  base_price: number;
  max_players: number;
  sort_order?: number;
}

type SetupCardProps = {
  setup: Setup;
  isSelected: boolean;
  onSelect: () => void;
};

export default function SetupCard({ setup, isSelected, onSelect }: SetupCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`font-sans relative w-full rounded-xl border p-5 text-left transition-all duration-300 ${
        isSelected
          ? "border-2 border-[#ff5200] bg-[rgba(255,82,0,0.05)] shadow-[0_0_20px_rgba(255,82,0,0.15)] selected-card"
          : "border-[#1A1F28] bg-[#0A0F18] hover:border-[rgba(255,82,0,0.5)] hover:translate-y-[-4px] hover:shadow-[0_0_30px_rgba(255,82,0,0.08)]"
      }`}
      aria-pressed={isSelected}
    >
      {setup.badge ? (
        <span className="absolute right-3 top-3 rounded bg-[#ff5200] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#0A0F18]" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.15em' }}>
          {setup.badge}
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-4 pr-16">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#2A2F38] bg-[#14181F] text-[#ff5200]">
          {setup.name === "arcade" ? (
            <Joystick className="h-5 w-5" />
          ) : setup.name === "racing" ? (
            <Gauge className="h-5 w-5" />
          ) : (
            <Gamepad2 className="h-5 w-5" />
          )}
        </div>
        {isSelected ? (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff5200] text-white">
            <Check className="h-4 w-4" />
          </div>
        ) : null}
      </div>

      <h3 className="mt-4 text-[18px] font-orbitron font-black text-[#F5F1EA]" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>{setup.display_name}</h3>
      <p className="mt-3 min-h-15 text-[13px] leading-5 text-[#A0A6AF] font-sans">{setup.description}</p>

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#1A1F28] pt-4">
        <div>
          <div className="price-text text-[26px] uppercase">Rs. {setup.base_price}</div>
          <div className="text-[12px] text-[#6B7280] font-sans">starting price</div>
        </div>
        <div className="text-right text-[12px] text-[#A0A6AF] font-sans">
          {setup.name === "racing" ? "30 minutes or 10 laps" : `Up to ${setup.max_players} players`}
        </div>
      </div>
    </button>
  );
}
