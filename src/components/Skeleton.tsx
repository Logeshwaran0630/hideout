"use client";

export function CardSkeleton() {
  return (
    <div className="rounded-xl p-6 border border-[#2A2A2A] bg-[#18181B]">
      <div className="skeleton h-32 w-full rounded-lg mb-4" />
      <div className="skeleton h-4 w-3/4 rounded mb-2" />
      <div className="skeleton h-4 w-1/2 rounded" />
    </div>
  );
}

export function BookingSkeleton() {
  return (
    <div className="bg-[#18181B] border border-[#2A2A2A] rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="skeleton h-5 w-32 rounded" />
        <div className="skeleton h-5 w-20 rounded" />
      </div>
      <div className="skeleton h-4 w-full rounded" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6">
      <div className="skeleton h-8 w-48 rounded mb-6" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl p-6 border border-[#2A2A2A] bg-[#18181B]">
          <div className="skeleton h-24 w-24 rounded-full mx-auto mb-4" />
          <div className="skeleton h-6 w-32 mx-auto rounded" />
          <div className="skeleton h-4 w-48 mx-auto mt-2 rounded" />
        </div>
        <div className="rounded-xl p-6 border border-[#2A2A2A] bg-[#18181B]">
          <div className="skeleton h-6 w-32 rounded mb-4" />
          <div className="skeleton h-12 w-full rounded mb-2" />
          <div className="skeleton h-4 w-3/4 rounded" />
        </div>
      </div>
    </div>
  );
}
