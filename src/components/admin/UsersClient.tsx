'use client';

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { CircleDollarSign, X } from "lucide-react";

type UserRow = {
  id: string;
  h_id: string;
  display_name: string | null;
  email: string;
  created_at: string;
  role: "user" | "admin";
};

type BookingCountRow = { user_id: string; status: string };
type CoinLedgerRow = { user_id: string; amount: number };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function UsersClient({ users, bookingCounts, coinLedger }: { users: UserRow[]; bookingCounts: BookingCountRow[]; coinLedger: CoinLedgerRow[] }) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const derived = useMemo(() => {
    const bookingMap = new Map<string, number>();
    bookingCounts.forEach((row) => bookingMap.set(row.user_id, (bookingMap.get(row.user_id) ?? 0) + 1));

    const coinMap = new Map<string, number>();
    coinLedger.forEach((row) => coinMap.set(row.user_id, (coinMap.get(row.user_id) ?? 0) + row.amount));

    return users
      .map((user) => ({
        ...user,
        bookings: bookingMap.get(user.id) ?? 0,
        coins: coinMap.get(user.id) ?? 0,
      }))
      .filter((user) => {
        const query = search.toLowerCase();
        return !query || user.h_id.toLowerCase().includes(query) || (user.display_name || "").toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
      });
  }, [users, bookingCounts, coinLedger, search]);

  async function applyAdjustment() {
    if (!selectedUser) return;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount === 0) return;

    await supabase.from("h_coin_ledger").insert({
      user_id: selectedUser.id,
      amount: numericAmount,
      type: numericAmount > 0 ? "earn" : "redeem",
      ref_booking_id: null,
    });

    setSelectedUser(null);
    setAmount("");
    setReason("");
    window.location.reload();
  }

  return (
    <div>
      <div className="mb-6">
        <div className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#FF3A3A]">USERS</div>
        <h1 className="mt-3 font-heading text-[48px] uppercase leading-none text-[#FAFAFA]">ALL USERS</h1>
      </div>

      <div className="mb-6 rounded-xl border border-[#27272A] bg-[#18181B] p-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by H-ID, name, or email..." className="w-full rounded-lg border border-[#27272A] bg-[#09090B] px-4 py-3 text-[14px] text-[#FAFAFA] outline-none focus:border-[#FF3A3A]" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#27272A] bg-[#18181B]">
        <table className="w-full border-collapse">
          <thead className="bg-[#09090B]">
            <tr className="border-b border-[#27272A]">
              {['H-ID', 'Name / Email', 'Joined', 'Bookings', 'H Coins', 'Role', 'Actions'].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-[12px] font-medium uppercase tracking-[0.1em] text-[#A1A1AA]">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {derived.map((user) => (
              <tr key={user.id} className="border-b border-[#27272A] transition-colors hover:bg-[#09090B]">
                <td className="px-4 py-4 font-mono text-[13px] text-[#FF3A3A]">{user.h_id}</td>
                <td className="px-4 py-4">
                  <div className="text-[14px] font-semibold text-[#FAFAFA]">{user.display_name || 'Hideout Player'}</div>
                  <div className="text-[12px] text-[#A1A1AA]">{user.email}</div>
                </td>
                <td className="px-4 py-4 text-[13px] text-[#A1A1AA]">{formatDate(user.created_at)}</td>
                <td className="px-4 py-4 text-[14px] font-semibold text-[#FAFAFA]">{user.bookings}</td>
                <td className="px-4 py-4 text-[14px] font-semibold text-[#FF3A3A]">{user.coins}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full border px-2 py-0.5 text-[12px] font-medium ${user.role === 'admin' ? 'border-[#FF3A3A] bg-[rgba(255,58,58,0.15)] text-[#FF3A3A]' : 'border-[#27272A] bg-[#18181B] text-[#A1A1AA]'}`}>{user.role === 'admin' ? 'ADMIN' : 'USER'}</span>
                </td>
                <td className="px-4 py-4">
                  <button type="button" onClick={() => setSelectedUser(user)} className="rounded-md border border-[#27272A] p-2 text-[#A1A1AA] transition-colors hover:border-[#FF3A3A] hover:text-[#FAFAFA]" aria-label="Adjust coins">
                    <CircleDollarSign className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-[420px] rounded-xl border border-[#FF3A3A] bg-[#18181B] p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-heading text-[32px] uppercase text-[#FAFAFA]">ADJUST H COINS</h2>
              <button type="button" onClick={() => setSelectedUser(null)} className="rounded-md p-2 text-[#A1A1AA] hover:text-[#FAFAFA]"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 font-mono text-[13px] text-[#FF3A3A]">{selectedUser.h_id}</div>
            <div className="text-[14px] text-[#FAFAFA]">{selectedUser.display_name || selectedUser.email}</div>
            <div className="mt-4 font-heading text-[48px] uppercase text-[#FF3A3A]">{derived.find((entry) => entry.id === selectedUser.id)?.coins ?? 0}<span className="text-[18px] text-[#A1A1AA]"> H Coins</span></div>
            <label className="mt-6 block">
              <div className="text-[13px] font-medium text-[#FAFAFA]">Amount to add or deduct</div>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="e.g. 10 or -10" className="mt-2 w-full rounded-lg border border-[#27272A] bg-[#09090B] px-4 py-3 text-[#FAFAFA] outline-none focus:border-[#FF3A3A]" />
            </label>
            <div className="mt-2 text-[12px] text-[#71717A]">Use positive number to add, negative to deduct.</div>
            <label className="mt-4 block">
              <div className="text-[13px] font-medium text-[#FAFAFA]">Reason (optional)</div>
              <input value={reason} onChange={(e) => setReason(e.target.value)} type="text" placeholder="e.g. Compensation for technical issue" className="mt-2 w-full rounded-lg border border-[#27272A] bg-[#09090B] px-4 py-3 text-[#FAFAFA] outline-none focus:border-[#FF3A3A]" />
            </label>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setSelectedUser(null)} className="flex-1 rounded-lg border border-[#27272A] px-4 py-3 text-[14px] text-[#A1A1AA] hover:text-[#FAFAFA]">Cancel</button>
              <button type="button" onClick={applyAdjustment} className="flex-1 rounded-lg bg-[#FF3A3A] px-4 py-3 text-[14px] font-semibold text-[#09090B]">Apply Adjustment</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
