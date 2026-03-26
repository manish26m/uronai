"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Settings, Key, Loader2, SimpleIcon, Sparkles } from "lucide-react";

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
    // Fetch the current key to populate if we want, but usually api keys are masked.
    // For now we'll just leave it blank, so they only write.
    // We can fetch /auth/me to see if they have a key.
    const fetchMe = async () => {
      if (!token) return;
      const res = await fetch(`${apiUrl}/auth/me`, { headers: authHeaders });
      if (res.ok) {
        const d = await res.json();
        if (d.gemini_api_key) setApiKey(d.gemini_api_key);
      }
    };
    fetchMe();
  }, [session, token, apiUrl]);

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
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Failed to save API Key");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-16">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">Platform Settings</h1>
        <p className="text-gray-500">Manage your integrations and API keys for AI generations.</p>
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Key size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Gemini API Integration</h2>
            <p className="text-sm text-gray-500">Bring your own Google Gemini Key for complex AI graphs.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Google Gemini API Key</label>
            <div className="relative">
              <input 
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSyB................................"
                className="w-full bg-gray-950 border border-gray-700 focus:border-blue-500 rounded-xl pl-10 pr-5 py-4 text-white font-mono text-sm focus:outline-none transition placeholder-gray-700"
              />
              <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Get an API key for free from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline">Google AI Studio</a>.
              If omitted, the platform default key is used.
            </p>
          </div>

          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition flex items-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Save Integration
          </button>
          
          {success && <p className="text-green-400 font-medium mt-2 text-sm">✓ API Key saved securely to your account!</p>}
          {error && <p className="text-red-400 font-medium mt-2 text-sm">✗ {error}</p>}
        </form>
      </div>
    </div>
  );
}
