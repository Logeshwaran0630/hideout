'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ScanBookingClientProps {
  booking: any;
}

export default function ScanBookingClient({ booking }: ScanBookingClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMarkPaid = async (paymentMode: 'cash' | 'upi') => {
    setLoading(true);
    setError(null);

    const response = await fetch('/api/admin/bookings/mark-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id, paymentMode }),
    });

    const data = await response.json();

    if (response.ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    } else {
      setError(data.error || 'Failed to mark as paid');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0F18] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Recorded!</h2>
          <p className="text-[#A0A6AF]">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F18] py-20 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Scan Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-[#FF4500]/20 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-[#FF4500]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Scan Result</h1>
          <p className="text-[#A0A6AF] mt-2">Booking found! Verify details and mark payment.</p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-[#14181F] border border-[#2A2F38] rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#FF4500] to-[#FF4500] px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-white/80 uppercase tracking-wider">Booking Code</div>
                <div className="text-2xl font-mono font-bold text-white">{booking.booking_code}</div>
              </div>
              {booking.payment_status === 'paid' ? (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">Paid</span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-500">Pending</span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#2A2F38]">
              <div>
                <div className="text-xs text-[#A0A6AF]">Customer Name</div>
                <div className="text-white font-medium">
                  {booking.users?.display_name || booking.users?.email}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#A0A6AF]">H-ID</div>
                <div className="text-white font-mono">{booking.users?.h_id}</div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#2A2F38]">
              <div>
                <div className="text-xs text-[#A0A6AF]">Date</div>
                <div className="text-white">
                  {new Date(booking.booking_date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#A0A6AF]">Time</div>
                <div className="text-white">{booking.time_slots?.label}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#2A2F38]">
              <div>
                <div className="text-xs text-[#A0A6AF]">Setup</div>
                <div className="text-white">{booking.setups?.display_name}</div>
              </div>
              <div>
                <div className="text-xs text-[#A0A6AF]">Session</div>
                <div className="text-white">{booking.session_types?.name}</div>
              </div>
            </div>

            {/* Amount */}
            <div className="bg-[#0A0F18] rounded-xl p-4 text-center">
              <div className="text-xs text-[#A0A6AF]">Total Amount</div>
              <div className="price-text text-3xl font-bold">Rs. {booking.total_price.toLocaleString('en-IN')}</div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Action Buttons - Only show if not paid */}
            {booking.payment_status !== 'paid' && (
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleMarkPaid('cash')}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold bg-[#60A5FA]/20 text-[#60A5FA] border border-[#60A5FA]/30 hover:bg-[#60A5FA]/30 transition disabled:opacity-50"
                >Cash</button>
                <button
                  onClick={() => handleMarkPaid('upi')}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/30 hover:bg-[#4ADE80]/30 transition disabled:opacity-50"
                >UPI</button>
              </div>
            )}

            {booking.payment_status === 'paid' && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-500">
                  <CheckCircle className="w-4 h-4" />
                  Already Paid
                </div>
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => router.push('/admin')}
              className="w-full mt-2 py-2 rounded-lg border border-[#2A2F38] text-[#A0A6AF] hover:border-[#FF4500] hover:text-white transition"
            >
              ←              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
