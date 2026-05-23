'use client';

import { Download, Printer, X } from 'lucide-react';

interface Booking {
  id: string;
  booking_code: string;
  booking_date: string;
  total_price: number;
  payment_status?: string | null;
  payment_mode?: string | null;
  paid_at?: string | null;
  users?: { display_name: string | null; email: string | null } | null;
  time_slots?: { label: string } | null;
  setups?: { display_name: string } | null;
}

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  date: Date;
  cashTotal: number;
  upiTotal: number;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatAmount(value: number) {
  return `Rs. ${value.toLocaleString('en-IN')}`;
}

export default function DailyReportModal({
  isOpen,
  onClose,
  bookings,
  date,
  cashTotal,
  upiTotal,
}: DailyReportModalProps) {
  if (!isOpen) return null;

  const totalRevenue = cashTotal + upiTotal;
  const pendingBookings = bookings.filter((booking) => booking.payment_status === 'pending');
  const pendingTotal = pendingBookings.reduce((sum, booking) => sum + booking.total_price, 0);

  const downloadCSV = () => {
    const headers = ['Booking Code', 'Customer', 'Setup', 'Time', 'Amount', 'Payment Status', 'Payment Mode', 'Paid At'];
    const rows = bookings.map((booking) => [
      booking.booking_code,
      booking.users?.display_name || booking.users?.email || '-',
      booking.setups?.display_name || '-',
      booking.time_slots?.label || '-',
      booking.total_price,
      booking.payment_status === 'paid' ? 'Paid' : 'Pending',
      booking.payment_mode ? booking.payment_mode.toUpperCase() : '-',
      booking.paid_at ? new Date(booking.paid_at).toLocaleString('en-IN') : '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `hideout_report_${date.toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = bookings
      .map((booking) => {
        const customer = booking.users?.display_name || booking.users?.email || '-';
        const status = booking.payment_status === 'paid' ? 'Paid' : 'Pending';
        const mode = booking.payment_mode ? booking.payment_mode.toUpperCase() : '-';

        return `
          <tr>
            <td>${escapeHtml(booking.booking_code)}</td>
            <td>${escapeHtml(customer)}</td>
            <td>${escapeHtml(booking.setups?.display_name || '-')}</td>
            <td>${escapeHtml(booking.time_slots?.label || '-')}</td>
            <td>${formatAmount(booking.total_price)}</td>
            <td>${status}</td>
            <td>${escapeHtml(mode)}</td>
          </tr>
        `;
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Report - ${date.toISOString().split('T')[0]}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #ff5200; color: white; }
            .summary { display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; }
            .card { padding: 15px; border: 1px solid #ddd; border-radius: 8px; min-width: 150px; }
          </style>
        </head>
        <body>
          <h1>Daily Payment Report</h1>
          <p>Date: ${date.toLocaleDateString('en-IN')}</p>
          <div class="summary">
            <div class="card"><strong>Total Revenue</strong><br/>${formatAmount(totalRevenue)}</div>
            <div class="card"><strong>Cash</strong><br/>${formatAmount(cashTotal)}</div>
            <div class="card"><strong>UPI</strong><br/>${formatAmount(upiTotal)}</div>
            <div class="card"><strong>Pending</strong><br/>${formatAmount(pendingTotal)}</div>
          </div>
          <table>
            <thead>
              <tr><th>Code</th><th>Customer</th><th>Setup</th><th>Time</th><th>Amount</th><th>Status</th><th>Mode</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl border border-[#2A2F38] bg-[#14181F]">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#2A2F38] bg-[#14181F] p-5">
          <div>
            <h2 className="text-2xl font-bold text-white">Daily Payment Report</h2>
            <p className="text-sm text-[#A0A6AF]">
              {date.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 transition hover:bg-[#0A0F18]">
            <X className="h-5 w-5 text-[#A0A6AF]" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-[#0A0F18] p-4 text-center">
              <div className="text-2xl font-bold text-white">{formatAmount(totalRevenue)}</div>
              <div className="text-xs text-[#A0A6AF]">Total Revenue</div>
            </div>
            <div className="rounded-xl bg-[#0A0F18] p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{formatAmount(cashTotal)}</div>
              <div className="text-xs text-[#A0A6AF]">Cash Collected</div>
            </div>
            <div className="rounded-xl bg-[#0A0F18] p-4 text-center">
              <div className="text-2xl font-bold text-[#4ADE80]">{formatAmount(upiTotal)}</div>
              <div className="text-xs text-[#A0A6AF]">UPI Collected</div>
            </div>
            <div className="rounded-xl bg-[#0A0F18] p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">{pendingBookings.length}</div>
              <div className="text-xs text-[#A0A6AF]">Pending Payments</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={downloadCSV} className="flex items-center gap-2 rounded-lg bg-[#ff5200] px-4 py-2 text-white transition hover:bg-[#cc2200]">
              <Download className="h-4 w-4" />
              Download CSV
            </button>
            <button type="button" onClick={handlePrint} className="flex items-center gap-2 rounded-lg border border-[#2A2F38] px-4 py-2 text-[#A0A6AF] transition hover:border-[#ff5200] hover:text-white">
              <Printer className="h-4 w-4" />
              Print Report
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#2A2F38]">
                <tr className="text-left text-[#A0A6AF]">
                  <th className="pb-3">Booking Code</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Setup</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Mode</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-[#2A2F38]">
                    <td className="py-3 font-mono text-[#ff5200]">{booking.booking_code}</td>
                    <td className="py-3 text-white">{booking.users?.display_name || booking.users?.email || '-'}</td>
                    <td className="py-3 text-[#A0A6AF]">{booking.setups?.display_name || '-'}</td>
                    <td className="py-3 text-[#A0A6AF]">{booking.time_slots?.label || '-'}</td>
                    <td className="py-3 font-semibold text-[#ff5200]">{formatAmount(booking.total_price)}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        booking.payment_status === 'paid'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {booking.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 text-[#A0A6AF]">{booking.payment_mode ? booking.payment_mode.toUpperCase() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
