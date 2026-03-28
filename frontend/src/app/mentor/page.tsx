"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { 
  BrainCircuit, Send, Loader2, Sparkles, User, 
  Settings, Video, Globe, MessageSquare, 
  Zap, ChevronRight, Bot
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function MentorPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [introLoading, setIntroLoading] = useState(true);
  
  // Settings
  const [language, setLanguage] = useState("English");
  const [enableYt, setEnableYt] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const token = (session as any)?.backendToken;

  useEffect(() => {
    if (token) fetchIntro();
  }, [token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const fetchIntro = async () => {
    setIntroLoading(true);
    try {
      const res = await fetch(`${apiUrl}/mentor/intro`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([{ role: "assistant", content: data.reply }]);
      }
    } catch (err) {
      setMessages([{ role: "assistant", content: "Hello! I am your AI Mentor. How can I help you progress in your learning journey today?" }]);
    } finally {
      setIntroLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/mentor/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: userMsg,
          language_pref: language,
          enable_yt: enableYt
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please check your internet and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-6xl mx-auto w-full gap-6">
      <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
        
        {/* Sidebar Settings */}
        <div className="w-full md:w-72 flex flex-col gap-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
                <BrainCircuit size={20} />
              </div>
              <h2 className="font-bold text-white">AI Mentor</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 block">Language Preference</label>
                <div className="grid grid-cols-1 gap-2">
                  {["English", "Hindi", "Spanish", "French"].map(lang => (
                    <button 
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                        language === lang 
                        ? "bg-red-600/10 border-red-500 text-red-400 font-bold" 
                        : "bg-gray-950/40 border-gray-800 text-gray-500 hover:border-gray-700"
                      }`}
                    >
                      <Globe size={14} />
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 block">Video Assistance</label>
                <button 
                  onClick={() => setEnableYt(!enableYt)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    enableYt 
                    ? "bg-red-600/10 border-red-500/30 text-red-400" 
                    : "bg-gray-950/40 border-gray-800 text-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Video size={16} />
                    YouTube Tips
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${enableYt ? "bg-red-500" : "bg-gray-700"}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${enableYt ? "right-0.5" : "left-0.5"}`} />
                  </div>
                </button>
                <p className="text-[10px] text-gray-600 mt-2 leading-relaxed px-1">
                  When enabled, the mentor will suggest high-quality YouTube resources.
                </p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-3 bg-gradient-to-br from-indigo-900/20 to-amber-900/10 border border-indigo-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-indigo-400 mb-1">
              <Zap size={14} />
              <span className="text-xs font-black uppercase tracking-wider">Pro Tip</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Ask your mentor to explain complex topics, or ask for a study schedule!
            </p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-950/30 border border-gray-800/50 rounded-3xl overflow-hidden backdrop-blur-sm relative shadow-2xl">
          
          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
          >
            {introLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                <Loader2 className="animate-spin text-red-500" size={32} />
                <p className="text-sm font-medium animate-pulse">Summoning your personal mentor...</p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex items-start gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                    m.role === "assistant" 
                    ? "bg-gradient-to-br from-red-600 to-indigo-600 text-white" 
                    : "bg-gray-800 text-gray-400 border border-gray-700"
                  }`}>
                    {m.role === "assistant" ? <Bot size={20} /> : <User size={20} />}
                  </div>
                  <div className={`max-w-[85%] px-5 py-4 rounded-2xl leading-relaxed text-sm ${
                    m.role === "assistant"
                    ? "bg-gray-900/80 border border-gray-800 text-gray-200"
                    : "bg-red-600 text-white shadow-xl shadow-red-900/20"
                  }`}>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                  <Bot size={20} />
                </div>
                <div className="bg-gray-900/80 border border-gray-800 px-5 py-4 rounded-2xl flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-gray-950/80 border-t border-gray-800 backdrop-blur-md">
            <form onSubmit={handleSend} className="relative max-w-4xl mx-auto w-full">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Message your mentor..."
                disabled={loading || introLoading}
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 rounded-2xl pl-6 pr-14 py-4 text-white focus:outline-none transition-all placeholder-gray-600 shadow-inner"
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading || introLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-red-900/40"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-[10px] text-center text-gray-600 mt-3 flex items-center justify-center gap-1.5">
              <Sparkles size={10} /> Powered by Gemini AI Coaching Engine
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
