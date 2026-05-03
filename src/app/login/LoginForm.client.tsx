"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { motion } from "framer-motion";

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

export default function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get("redirectTo") || "/profile";

  const [tab, setTab] = useState<"signin" | "signup">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetView, setResetView] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

  async function handleSignIn(emailValue: string, passwordValue: string) {
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailValue,
      password: passwordValue,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.session || !data.user) {
      setError("Sign in failed. Please try again.");
      setLoading(false);
      return;
    }

    await supabase.auth.getSession();

    if (data.user.email?.toLowerCase() === "admin@hideout.com") {
      router.replace("/admin");
    } else {
      router.replace(redirectTo || "/profile");
    }
  }

  async function handleSignUp(emailValue: string, passwordValue: string, displayNameValue: string) {
    setError(null);
    setLoading(true);

    if (passwordValue !== confirm) {
      setError("Passwords don't match.");
      setLoading(false);
      return;
    }
    if (passwordValue.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: emailValue,
      password: passwordValue,
      options: {
        data: { display_name: displayNameValue },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      if (data.user) {
        await supabase.auth.updateUser({
          data: {
            display_name: displayNameValue,
            role: "user",
          },
        });
      }
      router.replace("/profile");
    } else {
      setError(
        "Account created but email confirmation may be required. Check Supabase dashboard — disable email confirmation for instant login."
      );
      setLoading(false);
    }
  }

  async function handleForgotPassword(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setResetSent(false);
    if (!email) {
      setError("Enter your email to receive a reset link");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setResetSent(true);
  }

  const inputClass =
    "w-full rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#6B6B6B] focus:border-[#A855F7] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.15)] outline-none transition";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] flex items-center justify-center px-6 py-12">
      {/* Background blobs — same as Hero */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#A855F7]/20 blur-[120px] will-change-transform pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 14, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/3 right-1/4 h-80 w-80 rounded-full bg-[#3B82F6]/12 blur-[100px] will-change-transform pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7C3AED]/8 blur-[130px] will-change-transform pointer-events-none"
      />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative z-10 w-full max-w-md card-premium rounded-xl border border-[#2A2A2A] bg-[#18181B]/80 backdrop-blur-sm p-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="rounded-xl border border-[#2A2A2A] bg-[#0A0A0A]/60 px-6 py-3 backdrop-blur-sm">
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
        </div>

        {/* Tab switcher */}
        <div className="mt-6">
          <div className="flex gap-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] p-1">
            <button
              onClick={() => { setTab("signin"); setError(null); }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                tab === "signin"
                  ? "bg-[#A855F7] text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                  : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab("signup"); setError(null); }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                tab === "signup"
                  ? "bg-[#A855F7] text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                  : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {!resetView ? (
            tab === "signin" ? (
              <form
                onSubmit={(e) => { e.preventDefault(); handleSignIn(email, password); }}
                className="mt-6"
              >
                <h2 className="text-2xl font-bold uppercase tracking-wide text-white text-center">
                  Welcome Back
                </h2>
                <p className="text-sm text-[#A1A1AA] text-center mt-2">
                  Sign in to access your bookings and H Coins.
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="text-sm font-medium text-white mb-2">Email address</div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>

                  <div className="relative">
                    <div className="text-sm font-medium text-white mb-2">Password</div>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-10 text-[#A1A1AA] hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <div className="text-right mt-2">
                      <button
                        type="button"
                        onClick={() => setResetView(true)}
                        className="text-sm text-[#A855F7] hover:text-[#C084FC] transition"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.18)] p-3 text-sm text-[#EF4444] flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full rounded-lg px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); handleSignUp(email, password, displayName); }}
                className="mt-6"
              >
                <h2 className="text-2xl font-bold uppercase tracking-wide text-white text-center">
                  Create Account
                </h2>
                <p className="text-sm text-[#A1A1AA] text-center mt-2">
                  Join The Hideout. Your H-ID is generated automatically.
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="text-sm font-medium text-white mb-2">Display Name</div>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      type="text"
                      placeholder="What should we call you?"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium text-white mb-2">Email address</div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>

                  <div className="relative">
                    <div className="text-sm font-medium text-white mb-2">Password</div>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-10 text-[#A1A1AA] hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <div className="mt-2 h-1.5 w-full rounded bg-[#27272A]">
                      <div
                        className="h-1.5 rounded transition-all"
                        style={{ width: `${strength.pct}%`, background: strength.color }}
                      />
                    </div>
                    <div className="text-right text-xs mt-1" style={{ color: strength.color }}>
                      {strength.label}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-white mb-2">Confirm Password</div>
                    <input
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      className={`w-full rounded-lg bg-[#0A0A0A] border ${
                        confirm && confirm !== password
                          ? "border-[#EF4444]"
                          : confirm
                          ? "border-[#4ADE80]"
                          : "border-[#2A2A2A]"
                      } px-4 py-3 text-white placeholder:text-[#6B6B6B] focus:border-[#A855F7] outline-none transition`}
                    />
                    {confirm && confirm !== password && (
                      <div className="text-xs text-[#EF4444] mt-1">Passwords don't match</div>
                    )}
                  </div>

                  <div className="rounded-lg bg-[#A855F7]/8 border border-[#A855F7]/20 p-3 flex items-center gap-2 text-sm text-[#A1A1AA]">
                    <Sparkles className="h-4 w-4 text-[#A855F7] shrink-0" />
                    Your unique H-ID will be generated automatically when you sign up.
                  </div>

                  {error && (
                    <div className="rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.18)] p-3 text-sm text-[#EF4444] flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                    </div>
                  )}

                  <div className="text-center text-xs text-[#6B6B6B]">
                    By signing up, you agree to use The Hideout responsibly.
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full rounded-lg px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            <form onSubmit={handleForgotPassword} className="mt-6">
              <h2 className="text-2xl font-bold uppercase tracking-wide text-white text-center">
                Reset Password
              </h2>
              <p className="text-sm text-[#A1A1AA] text-center mt-2">
                Enter your email and we'll send a reset link.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="text-sm font-medium text-white mb-2">Email address</div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.18)] p-3 text-sm text-[#EF4444] flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                {resetSent ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <CheckCircle2 className="h-12 w-12 text-[#4ADE80]" />
                    <div className="text-sm font-semibold text-white">Reset link sent!</div>
                    <div className="text-sm text-[#A1A1AA]">
                      Check your inbox and follow the link to reset your password.
                    </div>
                    <button
                      type="button"
                      onClick={() => { setResetView(false); setResetSent(false); }}
                      className="text-sm text-[#A855F7] hover:text-[#C084FC] transition"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full rounded-lg px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                        </span>
                      ) : (
                        "Send Reset Link"
                      )}
                    </button>
                    <div className="text-sm text-[#A1A1AA] text-center">
                      <button
                        type="button"
                        onClick={() => setResetView(false)}
                        className="text-[#A855F7] hover:text-[#C084FC] transition"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
