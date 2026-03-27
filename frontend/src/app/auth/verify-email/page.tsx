"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Mail, ArrowLeft, ShieldCheck, RefreshCcw } from "lucide-react";
import Link from "next/link";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    if (!email) router.push("/auth/register");
  }, [email, router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiUrl}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code })
      });

      if (res.ok) {
        // Automatically sign in after verification
        router.push("/auth/login?verified=true&email=" + encodeURIComponent(email));
      } else {
        const data = await res.json();
        setError(data.detail || "Invalid verification code");
      }
    } catch (err) {
      setError("Connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    try {
      const res = await fetch(`${apiUrl}/auth/resend-otp?email=${encodeURIComponent(email)}`, {
        method: "POST"
      });
      if (res.ok) {
        setResendTimer(60);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-gray-950/50 border border-gray-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
          <Mail size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
        <p className="text-gray-400 text-sm">
          We&apos;ve sent a 6-digit verification code to<br />
          <span className="text-blue-400 font-medium">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between gap-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-${idx}`}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(e.target.value, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="w-12 h-14 bg-gray-900 border border-gray-800 rounded-xl text-center text-xl font-bold text-white focus:border-blue-500 focus:outline-none transition-all shadow-inner"
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm py-3 px-4 rounded-xl text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || otp.join("").length < 6}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/40"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20} /> Verify Account</>}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resendTimer > 0}
            className="text-sm text-gray-500 hover:text-white transition flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {resending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive code? Resend"}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center pt-6 border-t border-gray-900">
        <Link href="/auth/register" className="text-sm text-gray-500 hover:text-white transition flex items-center justify-center gap-2">
          <ArrowLeft size={14} /> Back to Registration
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="animate-spin text-blue-500" size={32} />}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
