"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const strength = score === 0 ? null : score === 1 ? "Weak" : score === 2 ? "Fair" : "Strong";
  const barColor = score === 1 ? "bg-red-500" : score === 2 ? "bg-yellow-500" : "bg-green-500";

  if (!password) return null;
  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? barColor : "bg-gray-800"}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map(c => (
          <span key={c.label} className={`flex items-center gap-1 text-[11px] font-medium ${c.ok ? "text-green-400" : "text-gray-600"}`}>
            {c.ok ? <CheckCircle2 size={10} /> : <XCircle size={10} />} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordsMatch = confirm && password === confirm;
  const passwordsMismatch = confirm && password !== confirm;

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
      if (!res.ok) {
        setError(d.detail || "Registration failed");
      } else if (d.status === "verify_email") {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        await signIn("credentials", { email, password, callbackUrl: "/dashboard" });
      }
    } catch { setError("Connection error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#07080f] flex relative overflow-hidden">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-blue-950/60 via-purple-950/40 to-[#07080f] border-r border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/50">U</div>
          <span className="text-2xl font-black text-white tracking-tight">uron<span className="text-blue-400">ai</span></span>
        </Link>
        <div className="relative z-10">
          <blockquote className="text-3xl font-light text-white/80 leading-relaxed italic mb-6">
            "The beautiful thing about learning is that nobody can take it away from you."
          </blockquote>
          <p className="text-gray-500 text-sm">— B.B. King</p>
        </div>
        <div className="flex items-center gap-6 relative z-10">
          {[["10K+", "Learners"], ["500+", "Roadmaps Created"], ["98%", "Completion Rate"]].map(([val, lbl]) => (
            <div key={lbl}>
              <p className="text-2xl font-black text-white">{val}</p>
              <p className="text-gray-500 text-xs">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg">U</div>
            <span className="text-xl font-black text-white">uron<span className="text-blue-400">ai</span></span>
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Create account</h1>
            <p className="text-gray-500">Start your AI-powered learning journey today.</p>
          </div>

          {/* Google */}
          <button onClick={() => { setGoogleLoading(true); signIn("google", { callbackUrl: "/dashboard" }); }} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-all mb-6 disabled:opacity-60 shadow-lg"
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
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe"
                  className="w-full bg-gray-900/80 border border-gray-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-gray-700 focus:outline-none transition text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="w-full bg-gray-900/80 border border-gray-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-gray-700 focus:outline-none transition text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Create a strong password"
                  className="w-full bg-gray-900/80 border border-gray-800 focus:border-blue-500 rounded-xl pl-10 pr-10 py-3.5 text-white placeholder-gray-700 focus:outline-none transition text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input type={showConfirm ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat your password"
                  className={`w-full bg-gray-900/80 border rounded-xl pl-10 pr-10 py-3.5 text-white placeholder-gray-700 focus:outline-none transition text-sm ${passwordsMismatch ? "border-red-500 focus:border-red-500" : passwordsMatch ? "border-green-500 focus:border-green-500" : "border-gray-800 focus:border-blue-500"}`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {passwordsMatch && <CheckCircle2 size={16} className="absolute right-9 top-1/2 -translate-y-1/2 text-green-400" />}
              </div>
              {passwordsMismatch && <p className="text-red-400 text-xs mt-1.5">Passwords do not match</p>}
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-950/40 border border-red-800/50 text-red-400 text-sm px-4 py-3 rounded-xl">
                <XCircle size={16} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading || !!passwordsMismatch}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><ArrowRight size={18} /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-semibold transition">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
