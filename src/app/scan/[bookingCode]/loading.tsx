export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0F18] px-6 py-20 text-white">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 animate-pulse rounded-full bg-[#ff5200]/20" />
          <div className="mx-auto h-8 w-40 animate-pulse rounded-xl bg-[#14181F]" />
          <div className="mx-auto mt-3 h-4 w-72 animate-pulse rounded-full bg-[#14181F]" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#2A2F38] bg-[#14181F]">
          <div className="h-20 animate-pulse bg-linear-to-r from-[#ff5200]/40 to-[#ff5200]/40" />
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 animate-pulse rounded-xl bg-[#0A0F18]" />
              <div className="h-16 animate-pulse rounded-xl bg-[#0A0F18]" />
            </div>
            <div className="h-24 animate-pulse rounded-xl bg-[#0A0F18]" />
            <div className="h-12 animate-pulse rounded-xl bg-[#0A0F18]" />
          </div>
        </div>
      </div>
    </div>
  );
}