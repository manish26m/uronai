"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, XCircle, UserPlus } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type ErrorType = "wrong_password" | "not_found" | "not_verified" | "generic" | null;

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Redirect authenticated users away immediately
  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorType(null);
    setErrorMsg("");

    try {
      // Step 1: Check credentials via our backend directly
      const checkRes = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await checkRes.json();

      // Handle specific backend errors
      if (checkRes.status === 404) {
        setErrorType("not_found");
        setErrorMsg(data.detail || "No account found with this email.");
        setLoading(false);
        return;
      }
      if (checkRes.status === 401) {
        setErrorType("wrong_password");
        setErrorMsg(data.detail || "Incorrect password.");
        setLoading(false);
        return;
      }
      if (data.status === "verify_email") {
        setErrorType("not_verified");
        setErrorMsg("Your email isn't verified yet.");
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        setLoading(false);
        return;
      }

      // Step 2: If backend is happy, sign in via NextAuth
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.ok) {
        router.replace("/dashboard");
      } else {
        setErrorType("generic");
        setErrorMsg("Something went wrong. Please try again.");
      }
    } catch {
      setErrorType("generic");
      setErrorMsg("Connection error. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-[#0c0505] flex relative overflow-hidden">
      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-14 relative overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/70 via-red-950/40 to-[#0c0505]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.18),transparent_65%)]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/8 rounded-full blur-3xl" />

        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-red-900/50">U</div>
          <span className="text-2xl font-black text-white tracking-tight">uron<span className="text-red-400">ai</span></span>
        </Link>

        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="text-4xl font-extralight text-white/80 leading-tight mb-4 tracking-tight">
              Welcome back to<br />
              <span className="font-black text-white">your learning universe.</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">Your AI-curated roadmaps, assessments, and mentor are ready and waiting.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[["🧠", "AI Mentor"], ["🗺️", "Smart Roadmaps"], ["🏆", "XP & Levels"], ["📊", "Career Match"]].map(([icon, lbl]) => (
              <div key={lbl} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
                <span className="text-base">{icon}</span>
                <span className="text-xs text-gray-400 font-semibold">{lbl}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-800 text-xs relative z-10">© {new Date().getFullYear()} UronAI. All rights reserved.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-sm">
          <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-amber-600 rounded-xl flex items-center justify-center text-white font-black text-lg">U</div>
            <span className="text-xl font-black text-white">uron<span className="text-red-400">ai</span></span>
          </Link>

          <div className="mb-8">
            <h1 className="text-[2.5rem] font-black text-white tracking-tight leading-none mb-2">Sign in</h1>
            <p className="text-gray-500 text-sm">Continue your adaptive learning journey.</p>
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
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-700 text-[11px] font-semibold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrorType(null); }} required
                  placeholder="you@example.com" autoComplete="email"
                  className={`w-full bg-gray-900/70 border rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-gray-700 focus:outline-none transition text-sm ${errorType === "not_found" ? "border-orange-500 focus:border-orange-400" : "border-gray-800 focus:border-red-500"}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input type={showPass ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setErrorType(null); }} required
                  placeholder="Your password" autoComplete="current-password"
                  className={`w-full bg-gray-900/70 border rounded-2xl pl-11 pr-11 py-3.5 text-white placeholder-gray-700 focus:outline-none transition text-sm ${errorType === "wrong_password" ? "border-red-500 focus:border-red-400" : "border-gray-800 focus:border-red-500"}`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Messages */}
            {errorType === "not_found" && (
              <div className="rounded-2xl border border-orange-500/30 bg-orange-950/20 p-4">
                <div className="flex items-start gap-3">
                  <XCircle size={16} className="text-orange-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-orange-300 text-sm font-semibold">Account not found</p>
                    <p className="text-orange-400/70 text-xs mt-0.5">No account with this email exists.</p>
                  </div>
                </div>
                <Link href={`/auth/register`}
                  className="mt-3 flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-300 text-sm font-bold px-4 py-2 rounded-xl transition w-full justify-center"
                >
                  <UserPlus size={15} /> Create a free account
                </Link>
              </div>
            )}

            {errorType === "wrong_password" && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/20 p-4">
                <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-red-300 text-sm font-semibold">Incorrect password</p>
                  <p className="text-red-400/70 text-xs mt-0.5">Double-check your password and try again.</p>
                </div>
              </div>
            )}

            {(errorType === "generic" || errorType === "not_verified") && (
              <div className="flex items-start gap-3 rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
                <XCircle size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <p className="text-gray-300 text-sm">{errorMsg}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-red-900/25 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><ArrowRight size={18} /> Sign In</>}
            </button>
          </form>

          <p className="text-center text-gray-700 text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-red-400 hover:text-red-300 font-bold transition">Create one free →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
