import { CheckCircle2 } from "lucide-react";

type SlotState = "available" | "selected" | "booked" | "past";

type SlotCardProps = {
  label: string;
  state: SlotState;
  onSelect?: () => void;
};

const stateClasses: Record<SlotState, string> = {
  available:
    "cursor-pointer bg-[#0A0A0A] border-[#2A2A2A] hover:border-[#3B82F6] hover:bg-[#27272A]",
  selected: "cursor-pointer border-[#A855F7] bg-[#27272A] glow-purple",
  booked: "cursor-not-allowed opacity-50 bg-[#0A0A0A] border-[#2A2A2A]",
  past: "cursor-not-allowed opacity-40 bg-[#0A0A0A] border-[#2A2A2A]",
};

const dotClasses: Record<SlotState, string> = {
  available: "bg-[#3B82F6]",
  selected: "bg-[#A855F7]",
  booked: "bg-[#6B6B6B]",
  past: "bg-[#3F3F46]",
};

const badgeClasses: Record<SlotState, string> = {
  available:
    "border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.1)] text-[#3B82F6]",
  selected:
    "border border-[#A855F7] bg-[rgba(168,85,247,0.15)] text-[#A855F7]",
  booked: "border border-transparent bg-transparent text-[#A1A1AA]",
  past: "border border-transparent bg-transparent text-[#6B6B6B]",
};

export default function SlotCard({ label, state, onSelect }: SlotCardProps) {
  const isInteractive = state === "available" || state === "selected";

  return (
    <button
      type="button"
      onClick={isInteractive ? onSelect : undefined}
      disabled={!isInteractive}
      className={`flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition-all duration-150 ${stateClasses[state]}`}
      aria-pressed={state === "selected"}
      aria-disabled={!isInteractive}
    >
      <div className="flex items-center gap-3">
        <span className={`h-2 w-2 rounded-full ${dotClasses[state]}`} />
        <span className="text-[15px] font-semibold text-[#FFFFFF]">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-[12px] font-medium ${badgeClasses[state]}`}>
          {state === "available"
            ? "Available"
            : state === "selected"
              ? "Selected"
              : state === "booked"
                ? "Taken"
                : "Passed"}
        </span>
        {state === "selected" ? <CheckCircle2 className="h-4 w-4 text-[#A855F7]" /> : null}
      </div>
    </button>
  );
}
