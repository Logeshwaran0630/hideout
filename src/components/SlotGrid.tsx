"use client";

import { useState } from "react";
import SlotCard from "./SlotCard";

const slots = [
  { label: "10:00 AM - 11:00 AM", state: "available" as const },
  { label: "11:00 AM - 12:00 PM", state: "available" as const },
  { label: "12:00 PM - 1:00 PM", state: "booked" as const },
  { label: "1:00 PM - 2:00 PM", state: "available" as const },
  { label: "2:00 PM - 3:00 PM", state: "booked" as const },
  { label: "3:00 PM - 4:00 PM", state: "available" as const },
];

export default function SlotGrid() {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  return (
    <div className="space-y-0 bg-[#0A0A0A]">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {slots.map(({ label, state }) => {
          const isSelected = selectedSlot === label;
          const slotState = isSelected ? "selected" : state;

          return (
            <SlotCard
              key={label}
              label={label}
              state={slotState}
              onSelect={() => {
                if (state !== "booked") {
                  setSelectedSlot(label);
                }
              }}
            />
          );
        })}
      </div>

      <p className="mt-6 text-sm text-[#A1A1AA]">
        {selectedSlot ? `Selected: ${selectedSlot}` : "Select a slot to continue"}
      </p>

      <button
        type="button"
        disabled={!selectedSlot}
        onClick={() => {
          if (selectedSlot) {
            console.log("Selected slot:", selectedSlot);
          }
        }}
        className={`mt-4 rounded-lg px-6 py-3 font-semibold transition duration-200 ${
          selectedSlot
            ? "bg-gradient-to-r from-[#A855F7] to-[#7C3AED] text-white hover:shadow-lg hover:shadow-[#A855F7]/50"
            : "cursor-not-allowed bg-[#3A3F48] text-[#A1A1AA]"
        }`}
      >
        Continue
      </button>

      <p className="mt-2 text-sm text-[#A1A1AA]">
        You will enter your details in the next step
      </p>
    </div>
  );
}
