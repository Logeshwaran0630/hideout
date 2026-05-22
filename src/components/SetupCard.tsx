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
      className={`font-accent relative w-full rounded-xl border p-5 text-left transition-all duration-150 ${
        isSelected
          ? "border-[#FF4500] bg-linear-to-r from-[#FF4500]/10 to-[#FF4500]/10 shadow-lg shadow-[#FF4500]/20"
          : "border-[#2A2F38] bg-[#0A0F18] hover:border-[#22C55E]"
      }`}
      aria-pressed={isSelected}
    >
      {setup.badge ? (
        <span className="absolute right-3 top-3 rounded bg-[#FF4500] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#0A0F18]">
          {setup.badge}
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-4 pr-16">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#2A2F38] bg-[#14181F] text-[#FF4500]">
          {setup.name === "arcade" ? (
            <Joystick className="h-5 w-5" />
          ) : setup.name === "racing" ? (
            <Gauge className="h-5 w-5" />
          ) : (
            <Gamepad2 className="h-5 w-5" />
          )}
        </div>
        {isSelected ? (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF4500] text-white">
            <Check className="h-4 w-4" />
          </div>
        ) : null}
      </div>

      <h3 className="mt-4 text-[18px] font-accent-bold text-[#F5F1EA]">{setup.display_name}</h3>
      <p className="mt-3 min-h-15 text-[13px] leading-5 text-[#A0A6AF]">{setup.description}</p>

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#2A2F38] pt-4">
        <div>
          <div className="font-accent-bold text-[26px] uppercase text-[#FF4500]">Rs. {setup.base_price}</div>
          <div className="text-[12px] text-[#71717A]">starting price</div>
        </div>
        <div className="text-right text-[12px] text-[#A0A6AF]">
          {setup.name === "racing" ? "30 minutes or 10 laps" : `Up to ${setup.max_players} players`}
        </div>
      </div>
    </button>
  );
}
