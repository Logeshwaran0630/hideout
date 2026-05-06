"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) && password.length >= 10) score++;
  if (score <= 1) return { label: "Weak", pct: 25, color: "#EF4444" };
  if (score === 2) return { label: "Fair", pct: 50, color: "#F89858" };
  if (score === 3) return { label: "Good", pct: 75, color: "#FBBF24" };
  return { label: "Strong", pct: 100, color: "#4ADE80" };
}

export default function ResetPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => passwordStrength(password), [password]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(error.message);
    else {
      router.push('/profile');
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-lg border border-[#27272A] bg-[#18181B] p-10">
        <div className="flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="The Hideout"
            width={160}
            height={40}
            style={{ width: "auto", height: "40px" }}
            priority
            loading="eager"
          />
        </div>

        <form onSubmit={handleReset} className="mt-6">
          <h2 className="font-heading text-2xl text-[#FAFAFA] text-center">SET NEW PASSWORD</h2>
          <p className="text-sm text-[#A1A1AA] text-center mt-2">Choose a strong password for your Hideout account.</p>

          <div className="mt-6 space-y-4">
            <label className="block text-sm text-[#FAFAFA] relative">
              <div className="text-sm font-medium mb-2">New password</div>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="New password" className="w-full rounded-md bg-[#0A0A0A] border border-[#27272A] px-4 py-3 text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#A855F7] outline-none" />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-10 text-[#A1A1AA]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              <div className="mt-2 h-1.5 w-full rounded bg-[#27272A]"><div className="h-1.5 rounded" style={{ width: `${strength.pct}%`, background: strength.color }} /></div>
              <div className="text-right text-xs mt-1" style={{ color: strength.color }}>{strength.label}</div>
            </label>

            <label className="block text-sm text-[#FAFAFA]">
              <div className="text-sm font-medium mb-2">Confirm Password</div>
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Confirm password" className={`w-full rounded-md bg-[#0A0A0A] border ${confirm && confirm !== password ? 'border-[#EF4444]' : confirm ? 'border-[#4ADE80]' : 'border-[#27272A]'} px-4 py-3 text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#A855F7] outline-none`} />
              {confirm && confirm !== password ? <div className="text-xs text-[#EF4444] mt-1">Passwords don't match</div> : null}
            </label>

            {error && <div className="rounded-md bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.18)] p-3 text-sm text-[#EF4444] flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}

            <button type="submit" disabled={loading} className="w-full rounded-md bg-gradient-to-r from-[#A855F7] to-[#7C3AED] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Updating...</span> : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
