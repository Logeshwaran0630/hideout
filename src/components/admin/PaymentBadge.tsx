'use client';

import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface PaymentBadgeProps {
  status?: string | null;
  endTime?: string; // Format: "20:00:00" (end time of slot)
  bookingDate?: string; // Format: "2026-05-14"
}

export default function PaymentBadge({ status, endTime, bookingDate }: PaymentBadgeProps) {
  // If paid, show paid badge
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
        <CheckCircle className="w-3.5 h-3.5" />
        Paid
      </span>
    );
  }

  // Check if overdue (booking end time has passed)
  let isOverdue = false;

  if (endTime && bookingDate) {
    const [hours, minutes] = endTime.split(':');
    const endDateTime = new Date(bookingDate);
    endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const now = new Date();
    isOverdue = now > endDateTime;
  }

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
        <AlertCircle className="w-3.5 h-3.5" />
        Overdue
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
      <Clock className="w-3.5 h-3.5" />
      Pending
    </span>
  );
}
