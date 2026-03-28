"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, XCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await checkRes.json();
      if (data.status === "verify_email") {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        setLoading(false); return;
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.ok) router.push("/dashboard");
      else setError("Invalid email or password. Please try again.");
    } catch { setError("Connection error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#07080f] flex relative overflow-hidden">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-indigo-950/60 via-blue-950/40 to-[#07080f] border-r border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.18),transparent_70%)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/50">U</div>
          <span className="text-2xl font-black text-white tracking-tight">uron<span className="text-blue-400">ai</span></span>
        </Link>
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-light text-white/90 leading-tight mb-4">
              Welcome back to your<br />
              <span className="font-black">learning universe.</span>
            </h2>
            <p className="text-gray-500 leading-relaxed">Your personalized AI roadmaps, quizzes, and mentor are waiting for you.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {[["🧠", "AI Mentor"], ["🗺️", "Smart Roadmaps"], ["🏆", "XP & Levels"], ["📊", "Career Match"]].map(([icon, lbl]) => (
              <div key={lbl} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <span>{icon}</span>
                <span className="text-xs text-gray-400 font-medium">{lbl}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-700 text-xs relative z-10">© {new Date().getFullYear()} UronAI. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg">U</div>
            <span className="text-xl font-black text-white">uron<span className="text-blue-400">ai</span></span>
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Sign in</h1>
            <p className="text-gray-500">Continue your adaptive learning journey.</p>
          </div>

          {/* Google */}
          <button onClick={() => { setGoogleLoading(true); signIn("google", { callbackUrl: "/dashboard" }); }} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3.5 px-4 rounded-xl transition-all mb-6 disabled:opacity-60 shadow-lg"
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

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">or email</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-gray-900/80 border border-gray-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-gray-700 focus:outline-none transition text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full bg-gray-900/80 border border-gray-800 focus:border-blue-500 rounded-xl pl-10 pr-10 py-3.5 text-white placeholder-gray-700 focus:outline-none transition text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-950/40 border border-red-800/50 text-red-400 text-sm px-4 py-3 rounded-xl">
                <XCircle size={15} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><ArrowRight size={18} /> Sign In</>}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 font-semibold transition">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
