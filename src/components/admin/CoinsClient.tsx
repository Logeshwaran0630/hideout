'use client';

type LedgerRow = {
  id: string;
  created_at: string;
  amount: number;
  type: string;
  users?: { h_id: string; display_name: string | null; email: string | null } | null;
  bookings?: { booking_code: string } | null;
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CoinsClient({ ledger, totalEarned, totalRedeemed }: { ledger: LedgerRow[]; totalEarned: number; totalRedeemed: number; }) {
  const inCirculation = totalEarned - totalRedeemed;

  return (
    <div>
      <div className="mb-6">
        <div className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#FF3A3A]">LEDGER</div>
        <h1 className="mt-3 font-heading text-[48px] uppercase leading-none text-[#FAFAFA]">H COIN LEDGER</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-6">
          <div className="text-[13px] text-[#A1A1AA]">Total Earned</div>
          <div className="mt-3 font-heading text-[40px] uppercase text-[#FF3A3A]">{totalEarned}</div>
        </div>
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-6">
          <div className="text-[13px] text-[#A1A1AA]">Total Redeemed</div>
          <div className="mt-3 font-heading text-[40px] uppercase text-[#EF4444]">{totalRedeemed}</div>
        </div>
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-6">
          <div className="text-[13px] text-[#A1A1AA]">In Circulation</div>
          <div className="mt-3 font-heading text-[40px] uppercase text-[#4ADE80]">{inCirculation}</div>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-[#27272A] bg-[#18181B]">
        <table className="w-full border-collapse">
          <thead className="bg-[#09090B]">
            <tr className="border-b border-[#27272A]">
              {['Date', 'User', 'Type', 'Amount', 'Booking', 'Balance Effect'].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-[12px] font-medium uppercase tracking-[0.1em] text-[#A1A1AA]">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ledger.map((row) => (
              <tr key={row.id} className="border-b border-[#27272A]">
                <td className="px-4 py-4 text-[13px] text-[#A1A1AA]">{formatTimestamp(row.created_at)}</td>
                <td className="px-4 py-4">
                  <div className="font-mono text-[12px] text-[#FF3A3A]">{row.users?.h_id}</div>
                  <div className="text-[12px] text-[#71717A]">{row.users?.email}</div>
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded-full border px-2 py-0.5 text-[12px] font-medium ${row.type === 'earn' ? 'border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ADE80]' : row.type === 'redeem' ? 'border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-[#EF4444]' : 'border-[rgba(255,58,58,0.3)] bg-[rgba(255,58,58,0.1)] text-[#FF3A3A]'}`}>{row.type}</span>
                </td>
                <td className={`px-4 py-4 text-[14px] font-semibold ${row.amount >= 0 ? 'text-[#4ADE80]' : 'text-[#EF4444]'}`}>{row.amount >= 0 ? `+${row.amount}` : row.amount}</td>
                <td className="px-4 py-4 font-mono text-[12px] text-[#A1A1AA]">{row.bookings?.booking_code ?? '—'}</td>
                <td className="px-4 py-4 text-[13px] text-[#A1A1AA]">{row.amount >= 0 ? '↑ Earned' : '↓ Redeemed'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
