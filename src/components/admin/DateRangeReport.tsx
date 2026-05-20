"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Download,
  FileText,
  IndianRupee,
  Landmark,
  Loader2,
  Printer,
  TrendingUp,
  Wallet,
  Clock,
  Users,
} from "lucide-react";

type ReportData = {
  summary: {
    startDate: string;
    endDate: string;
    totalRevenue: number;
    cashTotal: number;
    upiTotal: number;
    pendingAmount: number;
    totalBookings: number;
    paidBookings: number;
    pendingBookings: number;
    walkinBookings: number;
  };
  dailyBreakdown: Array<{
    date: string;
    dayName: string;
    bookings: number;
    revenue: number;
    cash: number;
    upi: number;
    pending: number;
  }>;
  setupPopularity: Array<{
    name: string;
    bookings: number;
    revenue: number;
  }>;
  paymentDistribution: {
    cash: number;
    upi: number;
    pending: number;
  };
  bookings: Array<Record<string, unknown>>;
};

type QuickRange = {
  label: string;
  getRange: () => { start: Date; end: Date };
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDayName(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
  });
}

export default function DateRangeReport() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return toDateInputValue(date);
  });
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quickRanges = useMemo<QuickRange[]>(
    () => [
      {
        label: "Today",
        getRange: () => {
          const today = new Date();
          return { start: today, end: today };
        },
      },
      {
        label: "Yesterday",
        getRange: () => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return { start: yesterday, end: yesterday };
        },
      },
      {
        label: "Last 7 Days",
        getRange: () => {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - 6);
          return { start, end };
        },
      },
      {
        label: "Last 30 Days",
        getRange: () => {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - 29);
          return { start, end };
        },
      },
      {
        label: "This Month",
        getRange: () => {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          return { start, end };
        },
      },
      {
        label: "Last Month",
        getRange: () => {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const end = new Date(now.getFullYear(), now.getMonth(), 0);
          return { start, end };
        },
      },
    ],
    []
  );

  async function generateReport() {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    if (startDate > endDate) {
      setError("Start date cannot be after end date");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/reports?startDate=${startDate}&endDate=${endDate}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate report");
      }

      setReport(data as ReportData);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Failed to generate report";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!report) return;

    const headers = ["Date", "Day", "Bookings", "Revenue", "Cash", "UPI", "Pending"];
    const rows = report.dailyBreakdown.map((day) => [
      day.date,
      day.dayName,
      String(day.bookings),
      String(day.revenue),
      String(day.cash),
      String(day.upi),
      String(day.pending),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hideout-report-${startDate}-to-${endDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    if (!report) return;

    const popup = window.open("", "_blank", "width=1200,height=900");
    if (!popup) return;

    popup.document.write(`
      <html>
        <head>
          <title>The Hideout - Financial Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { color: #ff5200; margin-bottom: 4px; }
            h2 { margin-top: 28px; }
            .meta { color: #666; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
            .card { border: 1px solid #ddd; border-radius: 12px; padding: 14px; }
            .label { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #666; }
            .value { font-size: 20px; font-weight: 700; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #ff5200; color: white; }
            .small { color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>The Hideout - Financial Report</h1>
          <div class="meta">${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}</div>
          <div class="grid">
            <div class="card"><div class="label">Total Revenue</div><div class="value">₹${report.summary.totalRevenue.toLocaleString("en-IN")}</div></div>
            <div class="card"><div class="label">Cash</div><div class="value">₹${report.summary.cashTotal.toLocaleString("en-IN")}</div></div>
            <div class="card"><div class="label">UPI</div><div class="value">₹${report.summary.upiTotal.toLocaleString("en-IN")}</div></div>
            <div class="card"><div class="label">Pending</div><div class="value">₹${report.summary.pendingAmount.toLocaleString("en-IN")}</div></div>
            <div class="card"><div class="label">Total Bookings</div><div class="value">${report.summary.totalBookings}</div></div>
          </div>
          <h2>Daily Breakdown</h2>
          <table>
            <thead>
              <tr><th>Date</th><th>Day</th><th>Bookings</th><th>Revenue</th><th>Cash</th><th>UPI</th><th>Pending</th></tr>
            </thead>
            <tbody>
              ${report.dailyBreakdown
                .map(
                  (day) => `
                    <tr>
                      <td>${formatDisplayDate(day.date)}</td>
                      <td>${day.dayName}</td>
                      <td>${day.bookings}</td>
                      <td>₹${day.revenue.toLocaleString("en-IN")}</td>
                      <td>₹${day.cash.toLocaleString("en-IN")}</td>
                      <td>₹${day.upi.toLocaleString("en-IN")}</td>
                      <td>₹${day.pending.toLocaleString("en-IN")}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
          <div class="small">Generated on ${new Date().toLocaleString("en-IN")}</div>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#FF4500]">REPORTS</div>
        <h1 className="mt-3 font-heading text-[48px] uppercase leading-none text-[#F5F1EA]">FINANCIAL REPORT</h1>
        <p className="mt-2 text-sm text-[#A0A6AF]">Generate financial reports for any date range.</p>
      </div>

      <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[#A0A6AF]">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-[#2A2F38] bg-[#0A0F18] px-4 py-2 text-white outline-none focus:border-devil-orange"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#A0A6AF]">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-[#2A2F38] bg-[#0A0F18] px-4 py-2 text-white outline-none focus:border-devil-orange"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={generateReport}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#FF4500] to-[#CC3700] px-5 py-2.5 font-semibold text-white transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            Generate Report
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickRanges.map((range) => (
            <button
              key={range.label}
              type="button"
              onClick={() => {
                const { start, end } = range.getRange();
                setStartDate(toDateInputValue(start));
                setEndDate(toDateInputValue(end));
              }}
              className="rounded-lg border border-[#2A2F38] bg-[#0A0F18] px-3 py-1.5 text-xs font-medium text-[#A0A6AF] transition hover:border-devil-orange hover:text-white"
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</div>
      ) : null}

      {report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard icon={IndianRupee} label="Total Revenue" value={`₹${report.summary.totalRevenue.toLocaleString("en-IN")}`} tone="text-green-500" />
            <SummaryCard icon={Wallet} label="Cash" value={`₹${report.summary.cashTotal.toLocaleString("en-IN")}`} tone="text-blue-500" />
            <SummaryCard icon={Landmark} label="UPI" value={`₹${report.summary.upiTotal.toLocaleString("en-IN")}`} tone="text-cyan-500" />
            <SummaryCard icon={Clock} label="Pending" value={`₹${report.summary.pendingAmount.toLocaleString("en-IN")}`} tone="text-yellow-500" />
            <SummaryCard icon={TrendingUp} label="Total Bookings" value={String(report.summary.totalBookings)} tone="text-white" subtext={`Walk-ins: ${report.summary.walkinBookings}`} />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2A2F38] bg-[#0A0F18] px-4 py-2 text-sm font-medium text-white transition hover:border-devil-orange"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2A2F38] bg-[#0A0F18] px-4 py-2 text-sm font-medium text-white transition hover:border-devil-orange"
            >
              <Printer className="h-4 w-4" /> Print Report
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F]">
              <div className="border-b border-[rgba(255,82,0,0.16)] p-4">
                <h2 className="font-accent-bold text-white">Daily Breakdown</h2>
                <p className="text-xs text-[#A0A6AF]">Day-by-day figures across the selected range.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-205">
                  <thead className="bg-[#0A0F18] text-left text-sm text-[#A0A6AF]">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Day</th>
                      <th className="px-4 py-3">Bookings</th>
                      <th className="px-4 py-3">Revenue</th>
                      <th className="px-4 py-3">Cash</th>
                      <th className="px-4 py-3">UPI</th>
                      <th className="px-4 py-3">Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.dailyBreakdown.map((day) => (
                      <tr key={day.date} className="border-t border-[rgba(255,82,0,0.08)]">
                        <td className="px-4 py-3 text-white">{formatDisplayDate(day.date)}</td>
                        <td className="px-4 py-3 text-[#A0A6AF]">{day.dayName}</td>
                        <td className="px-4 py-3 text-white">{day.bookings}</td>
                        <td className="px-4 py-3 text-green-500">₹{day.revenue.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-blue-500">₹{day.cash.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-cyan-500">₹{day.upi.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-yellow-500">₹{day.pending.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <ChartCard title="Setup Popularity" subtitle="Bookings by setup">
                <div className="space-y-4">
                  {report.setupPopularity.length > 0 ? (
                    report.setupPopularity.map((setup) => (
                      <div key={setup.name}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-white">{setup.name}</span>
                          <span className="text-[#A0A6AF]">{setup.bookings} bookings</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#0A0F18]">
                          <div
                            className="h-2 rounded-full bg-linear-to-r from-[#FF4500] to-[#22C55E]"
                            style={{ width: `${Math.max(8, Math.min(100, setup.revenue > 0 ? (setup.revenue / Math.max(report.summary.totalRevenue, 1)) * 100 : 8))}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-[#A0A6AF]">₹{setup.revenue.toLocaleString("en-IN")}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-[#A0A6AF]">No bookings in this range.</div>
                  )}
                </div>
              </ChartCard>

              <ChartCard title="Payment Distribution" subtitle="Collected vs pending">
                <div className="space-y-4">
                  {[
                    { label: "Cash", value: report.paymentDistribution.cash, tone: "from-blue-500 to-blue-300" },
                    { label: "UPI", value: report.paymentDistribution.upi, tone: "from-cyan-500 to-cyan-300" },
                    { label: "Pending", value: report.paymentDistribution.pending, tone: "from-yellow-500 to-yellow-300" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-white">{item.label}</span>
                        <span className="text-[#A0A6AF]">₹{item.value.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#0A0F18]">
                        <div
                          className={`h-2 rounded-full bg-linear-to-r ${item.tone}`}
                          style={{ width: `${Math.max(6, Math.min(100, (item.value / Math.max(report.summary.totalRevenue + report.summary.pendingAmount, 1)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-12 text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-[#A0A6AF]" />
          <p className="text-[#A0A6AF]">Select a date range and generate a report.</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
  subtext,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
  tone: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-4">
      <div className="mb-2 flex items-center gap-2 text-sm text-[#A0A6AF]">
        <Icon className={`h-4 w-4 ${tone}`} /> {label}
      </div>
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
      {subtext ? <div className="mt-1 text-xs text-[#A0A6AF]">{subtext}</div> : null}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-6">
      <h2 className="font-accent-bold text-white">{title}</h2>
      <p className="mb-4 text-xs text-[#A0A6AF]">{subtitle}</p>
      {children}
    </div>
  );
}
