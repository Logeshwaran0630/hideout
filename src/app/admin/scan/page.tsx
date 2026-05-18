'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Keyboard, Search, Ticket } from 'lucide-react';

export default function AdminScanPage() {
  const router = useRouter();
  const [bookingCode, setBookingCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCode.trim()) {
      setError("Please enter a booking code");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Format the code
    let code = bookingCode.trim().toUpperCase();
    if (!code.startsWith('HBK-')) {
      code = `HBK-${code}`;
    }
    
    // Check if booking exists
    try {
      const response = await fetch(`/api/bookings/check?code=${code}`);
      const data = await response.json();
      
      if (data.exists) {
        router.push(`/scan/${code}`);
      } else {
        setError(`Booking code ${code} not found`);
      }
    } catch (err) {
      setError("Error checking booking. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0F18] py-20 px-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#FF4500]/20">
            <Ticket className="h-10 w-10 text-[#FF4500]" />
          </div>
          <h1 className="text-3xl font-bold text-white">Find Booking</h1>
          <p className="mt-2 text-[#A0A6AF]">Enter booking code to mark payment</p>
        </div>

        <div className="mb-6 rounded-xl border border-[#2A2F38] bg-[#14181F] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF4500]/10">
              <Camera className="h-5 w-5 text-[#FF4500]" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-white">Scan QR Code</div>
              <div className="text-xs text-[#A0A6AF]">Coming soon - Scan customer QR code directly</div>
            </div>
            <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-500">Coming Soon</span>
          </div>
        </div>

        <div className="bg-[#14181F] border border-[#2A2F38] rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-[#2A2F38] pb-3">
            <Keyboard className="h-4 w-4 text-[#FF4500]" />
            <span className="font-medium text-white">Manual Entry</span>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="mb-2 block text-sm font-medium text-white">
              Booking Code
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value)}
                placeholder="HBK-001027 or 001027"
                className="flex-1 rounded-xl border border-[#2A2F38] bg-[#0A0F18] px-4 py-3 font-mono text-white outline-none focus:border-[#FF4500]"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-[#FF4500] to-[#FF4500] px-6 py-3 font-semibold text-white transition hover:scale-105 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="mt-4 text-center text-xs text-[#A0A6AF]">
            Enter full code like <span className="text-[#FF4500]">HBK-001027</span> or just the number <span className="text-[#FF4500]">001027</span>
          </div>
        </div>

        <button
          onClick={() => router.push('/admin')}
          className="w-full mt-4 rounded-lg border border-[#2A2F38] py-2 text-[#A0A6AF] transition hover:border-[#FF4500] hover:text-white"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
