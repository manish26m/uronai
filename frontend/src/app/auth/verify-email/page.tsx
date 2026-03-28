"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, ShieldCheck, RefreshCcw, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (!email) router.push("/auth/register"); }, [email, router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    // Auto-submit when all filled
    if (value && newOtp.every(d => d) && newOtp.join("").length === 6) {
      submitOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const arr = pasted.split("");
      setOtp(arr);
      inputRefs.current[5]?.focus();
      setTimeout(() => submitOtp(pasted), 100);
    }
  };

  const submitOtp = async (code: string) => {
    if (code.length < 6 || loading) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/verify-email`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push(`/auth/login?verified=true&email=${encodeURIComponent(email)}`), 1500);
      } else {
        const d = await res.json();
        setError(d.detail || "Invalid verification code");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch { setError("Connection failed. Try again."); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    try {
      await fetch(`${API}/auth/resend-otp?email=${encodeURIComponent(email)}`, { method: "POST" });
      setResendTimer(60);
      setError("");
    } finally { setResending(false); }
  };

  const filled = otp.every(d => d);

  return (
    <div className="min-h-screen bg-[#07080f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg">U</div>
          <span className="text-xl font-black text-white">uron<span className="text-blue-400">ai</span></span>
        </Link>

        <div className="bg-gray-950/60 border border-gray-800/70 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          {success ? (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={40} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Email Verified!</h2>
              <p className="text-gray-400 text-sm">Redirecting you to sign in...</p>
              <Loader2 className="animate-spin text-blue-400 mt-4" size={20} />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Mail size={30} className="text-blue-400" />
                </div>
                <h1 className="text-2xl font-black text-white mb-2">Check your inbox</h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  We sent a 6-digit code to<br />
                  <span className="text-blue-400 font-semibold">{email}</span>
                </p>
              </div>

              {/* OTP Inputs */}
              <div className="flex justify-center gap-2.5 mb-6" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { inputRefs.current[idx] = el; }}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(e.target.value, idx)}
                    onKeyDown={e => handleKeyDown(e, idx)}
                    className={`w-12 h-14 rounded-xl text-center text-2xl font-black transition-all focus:outline-none border-2 ${
                      error ? "border-red-500 bg-red-950/20 text-red-300"
                      : digit ? "border-blue-500 bg-blue-500/10 text-white"
                      : "border-gray-800 bg-gray-900/60 text-white focus:border-blue-500"
                    }`}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/50 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 justify-center">
                  <XCircle size={15} /> {error}
                </div>
              )}

              <button
                onClick={() => submitOtp(otp.join(""))}
                disabled={loading || !filled}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/30 mb-4"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><ShieldCheck size={18} /> Verify Account</>}
              </button>

              <div className="text-center">
                <button
                  onClick={handleResend}
                  disabled={resending || resendTimer > 0}
                  className="text-sm text-gray-500 hover:text-white transition flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  {resending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />}
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive it? Resend"}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-900 text-center">
                <Link href="/auth/register" className="text-xs text-gray-600 hover:text-gray-400 transition">
                  ← Back to register
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07080f] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
