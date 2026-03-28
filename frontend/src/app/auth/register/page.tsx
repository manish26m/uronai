"use client";
import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Mail, Lock, User, Eye, EyeOff,
  ArrowRight, XCircle, CheckCircle2, ShieldCheck, RefreshCcw
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ chars", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  if (!password) return null;
  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? score === 1 ? "bg-red-500" : score === 2 ? "bg-yellow-500" : "bg-green-500" : "bg-gray-800"}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {checks.map(c => (
          <span key={c.label} className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${c.ok ? "text-green-400" : "text-gray-700"}`}>
            {c.ok ? <CheckCircle2 size={10} /> : <XCircle size={10} />} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

type Step = "form" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const mismatch = confirm && password !== confirm;
  const match = confirm && password === confirm;

  useEffect(() => {
    if (step === "otp") setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [step]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(v => v - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // ── Step 1: Submit registration form ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.detail || "Registration failed"); return; }
      if (d.status === "verify_email") {
        setStep("otp"); // Show OTP inline — no page redirect
        setResendTimer(60);
      } else {
        await signIn("credentials", { email, password, callbackUrl: "/dashboard" });
      }
    } catch { setError("Connection error. Please try again."); }
    finally { setLoading(false); }
  };

  // ── OTP handlers ──
  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (val && next.every(d => d)) submitOtp(next.join(""));
  };

  const handleOtpKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (digits.length === 6) {
      setOtp(digits.split(""));
      inputRefs.current[5]?.focus();
      setTimeout(() => submitOtp(digits), 80);
    }
  };

  const submitOtp = async (code: string) => {
    if (code.length < 6 || otpLoading) return;
    setOtpLoading(true); setOtpError("");
    try {
      const res = await fetch(`${API}/auth/verify-email`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      if (res.ok) {
        setOtpSuccess(true);
        await signIn("credentials", { email, password, callbackUrl: "/dashboard" });
      } else {
        const d = await res.json();
        setOtpError(d.detail || "Invalid code. Please try again.");
        setOtp(["", "", "", "", "", ""]); inputRefs.current[0]?.focus();
      }
    } catch { setOtpError("Connection failed."); }
    finally { setOtpLoading(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true); setOtpError("");
    try {
      await fetch(`${API}/auth/resend-otp?email=${encodeURIComponent(email)}`, { method: "POST" });
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]); inputRefs.current[0]?.focus();
    } finally { setResending(false); }
  };

  // ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#07080f] flex relative overflow-hidden">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-14 relative overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/60 via-blue-950/40 to-[#07080f]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.15),transparent_65%)]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl" />

        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-blue-900/50">U</div>
          <span className="text-2xl font-black text-white tracking-tight">uron<span className="text-blue-400">ai</span></span>
        </Link>

        <div className="relative z-10 space-y-8">
          <div>
            <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-3">Start your journey</p>
            <h2 className="text-4xl font-extralight text-white/80 leading-tight tracking-tight mb-4">
              Learn anything.<br />
              <span className="font-black text-white">Master everything.</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">AI builds your personalized roadmap from any YouTube playlist. You just learn.</p>
          </div>
          <div className="space-y-3">
            {[
              ["🗺️", "AI-generated step-by-step roadmaps"],
              ["🧠", "Personal AI mentor for every module"],
              ["🏆", "Gamified XP, levels & certifications"],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 text-sm text-gray-400">
                <span className="text-lg">{icon}</span> {text}
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-800 text-xs relative z-10">© {new Date().getFullYear()} UronAI.</p>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-sm">
          <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg">U</div>
            <span className="text-xl font-black text-white">uron<span className="text-blue-400">ai</span></span>
          </Link>

          {/* ── OTP Step (inline) ── */}
          {step === "otp" ? (
            <div>
              <div className="mb-8">
                <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Mail size={26} className="text-blue-400" />
                </div>
                {otpSuccess ? (
                  <>
                    <h2 className="text-3xl font-black text-white mb-1">Verified! 🎉</h2>
                    <p className="text-gray-500 text-sm">Signing you in...</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-black text-white mb-1">Check your email</h2>
                    <p className="text-gray-500 text-sm">
                      We sent a 6-digit code to <span className="text-blue-400 font-semibold">{email}</span>
                    </p>
                  </>
                )}
              </div>

              {!otpSuccess && (
                <>
                  <div className="flex justify-between gap-2 mb-5 w-full mx-auto" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => { inputRefs.current[idx] = el; }}
                        type="text" inputMode="numeric" maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(e.target.value, idx)}
                        onKeyDown={e => handleOtpKey(e, idx)}
                        className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl text-center text-2xl font-black focus:outline-none border-2 transition-all ${
                          otpError ? "border-red-500 bg-red-950/20 text-red-300"
                          : digit ? "border-blue-500 bg-blue-500/10 text-white"
                          : "border-gray-800 bg-gray-900/60 text-white focus:border-blue-500"
                        }`}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <div className="flex items-center gap-2 bg-red-950/30 border border-red-800/40 text-red-400 text-sm px-4 py-3 rounded-2xl mb-4">
                      <XCircle size={14} /> {otpError}
                    </div>
                  )}

                  <button
                    onClick={() => submitOtp(otp.join(""))}
                    disabled={otpLoading || otp.some(d => !d)}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-900/25 mb-4"
                  >
                    {otpLoading ? <Loader2 className="animate-spin" size={18} /> : <><ShieldCheck size={18} /> Verify Account</>}
                  </button>

                  <div className="flex items-center justify-between">
                    <button onClick={() => { setStep("form"); setOtp(["","","","","",""]); setOtpError(""); }}
                      className="text-xs text-gray-600 hover:text-gray-400 transition">
                      ← Back
                    </button>
                    <button onClick={handleResend} disabled={resending || resendTimer > 0}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition disabled:opacity-40"
                    >
                      {resending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                    </button>
                  </div>
                </>
              )}

              {otpSuccess && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 className="animate-spin text-blue-400" size={24} />
                  <span className="text-gray-400 text-sm">Redirecting to dashboard...</span>
                </div>
              )}
            </div>
          ) : (
            /* ── Registration Form Step ── */
            <>
              <div className="mb-8">
                <h1 className="text-[2.5rem] font-black text-white tracking-tight leading-none mb-2">Create account</h1>
                <p className="text-gray-500 text-sm">Start your AI-powered learning journey.</p>
              </div>

              {/* Google */}
              <button onClick={() => { setGoogleLoading(true); signIn("google", { callbackUrl: "/dashboard" }); }} disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3.5 px-4 rounded-2xl transition-all mb-6 disabled:opacity-60 shadow-lg shadow-black/20"
              >
                {googleLoading ? <Loader2 className="animate-spin" size={18} /> : (
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Sign up with Google
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-gray-700 text-[11px] font-semibold uppercase tracking-widest">or email</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name"
                      className="w-full bg-gray-900/70 border border-gray-800 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-gray-700 focus:outline-none transition text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                      className="w-full bg-gray-900/70 border border-gray-800 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-gray-700 focus:outline-none transition text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Create a strong password"
                      className="w-full bg-gray-900/70 border border-gray-800 focus:border-blue-500 rounded-2xl pl-11 pr-11 py-3.5 text-white placeholder-gray-700 focus:outline-none transition text-sm"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input type={showConfirm ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat your password"
                      className={`w-full bg-gray-900/70 border rounded-2xl pl-11 pr-11 py-3.5 text-white placeholder-gray-700 focus:outline-none transition text-sm ${mismatch ? "border-red-500 focus:border-red-400" : match ? "border-green-500 focus:border-green-400" : "border-gray-800 focus:border-blue-500"}`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {match && <CheckCircle2 size={14} className="absolute right-11 top-1/2 -translate-y-1/2 text-green-400" />}
                  </div>
                  {mismatch && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><XCircle size={11} /> Passwords do not match</p>}
                </div>

                {error && (
                  <div className="flex items-start gap-3 bg-red-950/30 border border-red-800/40 text-red-400 text-sm px-4 py-3 rounded-2xl">
                    <XCircle size={14} className="mt-0.5 shrink-0" /> {error}
                  </div>
                )}

                <button type="submit" disabled={loading || !!mismatch}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <><ArrowRight size={18} /> Create Account</>}
                </button>
              </form>

              <p className="text-center text-gray-700 text-sm mt-6">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-bold transition">Sign in →</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
