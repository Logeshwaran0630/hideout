import { CheckCircle2 } from "lucide-react";

type SlotState = "available" | "selected" | "booked" | "past";

type SlotCardProps = {
  label: string;
  state: SlotState;
  onSelect?: () => void;
};

const stateClasses: Record<SlotState, string> = {
  available:
    "cursor-pointer bg-[#0A0F18] border-[#1A1F28] hover:border-[rgba(255,82,0,0.5)] hover:bg-[#1F242C] transition-all duration-300",
  selected:
    "cursor-pointer border-2 border-[#ff5200] bg-[rgba(255,82,0,0.08)] shadow-[0_0_0_2px_rgba(255,82,0,0.2)] selected-slot",
  booked:
    "cursor-not-allowed opacity-50 bg-[#0A0F18] border-[#1A1F28]",
  past:
    "cursor-not-allowed opacity-40 bg-[#0A0F18] border-[#1A1F28]",
};

const dotClasses: Record<SlotState, string> = {
  available: "bg-[#22C55E]",
  selected: "bg-[#ff5200]",
  booked: "bg-[#3F3F46]",
  past: "bg-[#3A3F48]",
};

const badgeClasses: Record<SlotState, string> = {
  available:
    "border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.1)] text-[#22C55E]",
  selected:
    "border border-[#ff5200] bg-[rgba(255,82,0,0.15)] text-[#ff5200]",
  booked: "border border-transparent bg-transparent text-[#A0A6AF]",
  past: "border border-transparent bg-transparent text-[#6B7280]",
};

export default function SlotCard({ label, state, onSelect }: SlotCardProps) {
  const isInteractive = state === "available" || state === "selected";

  return (
    <button
      type="button"
      onClick={isInteractive ? onSelect : undefined}
      disabled={!isInteractive}
      className={`font-accent flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition-all duration-150 ${stateClasses[state]}`}
      aria-pressed={state === "selected"}
      aria-disabled={!isInteractive}
    >
      <div className="flex items-center gap-3">
        <span className={`h-2 w-2 rounded-full ${dotClasses[state]}`} />
        <span className="text-[15px] font-sans font-bold text-[#F5F1EA]">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-[12px] font-sans font-semibold ${badgeClasses[state]}`}>
          {state === "available"
            ? "Available"
            : state === "selected"
              ? "Selected"
              : state === "booked"
                ? "Taken"
                : "Passed"}
        </span>
        {state === "selected" ? <CheckCircle2 className="h-4 w-4 text-[#ff5200]" /> : null}
      </div>
    </button>
  );
}
