"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Key, Loader2, Sparkles, CheckCircle2, XCircle, ExternalLink, Shield, User } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const token = (session as any)?.backendToken;
  const authHeaders = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  useEffect(() => {
    if (!token) return;
    fetch(`${apiUrl}/auth/me`, { headers: authHeaders })
      .then(r => r.json())
      .then(d => { if (d.gemini_api_key) setApiKey(d.gemini_api_key); })
      .catch(() => {});
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setSuccess(false); setError("");
    try {
      const res = await fetch(`${apiUrl}/auth/api-key`, {
        method: "POST", headers: authHeaders,
        body: JSON.stringify({ api_key: apiKey }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3500);
      } else {
        setError("Failed to save key. Make sure it starts with 'AIzaSy'.");
      }
    } catch {
      setError("Network error — is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const userName = session?.user?.name || "Learner";
  const userEmail = session?.user?.email || "";
  const userRole = (session?.user as any)?.role || "student";

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and AI integrations.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={15} className="text-gray-500" />
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Your Account</h2>
        </div>
        <div className="flex items-center gap-4">
          {session?.user?.image ? (
            <img src={session.user.image} className="w-16 h-16 rounded-2xl ring-2 ring-blue-500/30 object-cover" alt="" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-black">
              {userName[0]}
            </div>
          )}
          <div>
            <p className="text-xl font-bold text-white">{userName}</p>
            <p className="text-gray-500 text-sm">{userEmail}</p>
            <span className={`inline-flex items-center gap-1.5 mt-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${
              userRole === "admin"
                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
            }`}>
              <Shield size={11} />
              {userRole === "admin" ? "Admin" : "Student"}
            </span>
          </div>
        </div>
      </div>

      {/* Gemini API Key */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Key size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Gemini API Key</h2>
              <p className="text-sm text-gray-500">Personal key for private, high-quota AI generation</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">API Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="AIzaSy................................"
                  className="w-full bg-gray-950 border border-gray-700 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3.5 text-white font-mono text-sm focus:outline-none transition-all placeholder-gray-700"
                />
                <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
              </div>
              <p className="text-xs text-gray-600 mt-2 flex items-center gap-1.5">
                Free keys from
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                >
                  Google AI Studio <ExternalLink size={10} />
                </a>
                — If omitted, the platform default key is used.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/30 hover:scale-105"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Save Key
              </button>
              {success && (
                <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                  <CheckCircle2 size={16} /> Saved securely!
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                  <XCircle size={16} /> {error}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-4 bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
        <Sparkles size={15} className="text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-white mb-1">How does the API key work?</h4>
          <p className="text-sm text-gray-500 leading-relaxed">
            UronAI uses Google Gemini to generate your learning roadmaps, quizzes, and AI coaching. Adding your own key ensures you have higher rate limits and private quota. Your key is stored securely and never exposed.
          </p>
        </div>
      </div>
    </div>
  );
}
