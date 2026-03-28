"use client";

import Link from "next/link";
import { ArrowRight, Brain, Zap, Trophy, Map, Sparkles, ChevronRight, CheckCircle2, Star } from "lucide-react";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const features = [
    { icon: Brain, title: "AI-Generated Roadmaps", desc: "Instantly build personalized skill trees tailored to your exact pacing and goals.", color: "from-blue-400 to-indigo-500", shadow: "shadow-blue-500/50" },
    { icon: Zap, title: "Adaptive Assessments", desc: "Smart quizzes generated in real-time from YouTube transcripts test actual comprehension.", color: "from-amber-400 to-orange-500", shadow: "shadow-orange-500/50" },
    { icon: Map, title: "Living Skill Tree", desc: "Fail a concept? Watch your roadmap dynamically branch out with remedial modules.", color: "from-emerald-400 to-teal-500", shadow: "shadow-emerald-500/50" },
    { icon: Trophy, title: "Gamified Progression", desc: "Earn XP, unlock certificates, and prove your readiness to top-tier employers.", color: "from-fuchsia-400 to-purple-500", shadow: "shadow-purple-500/50" },
  ];

  if (!mounted) return <div className="min-h-screen bg-[#07080f]" />;

  return (
    <div className="min-h-screen bg-[#07080f] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay z-50"></div>
      
      {/* 3D Ambient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-blue-600/15 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">U</div>
          </div>
          <span className="text-2xl font-black tracking-tight text-white drop-shadow-md">uron<span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">ai</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="hidden sm:block text-gray-300 hover:text-white text-sm font-bold transition-colors">Sign In</Link>
          <Link href="/auth/register" className="relative group overflow-hidden rounded-2xl p-[1px]">
            <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
            <div className="relative bg-black/40 backdrop-blur-xl hover:bg-black/20 text-white text-sm font-bold px-6 py-3 rounded-2xl transition-all flex items-center gap-2">
              <Sparkles size={16} className="text-blue-300" /> Start Free
            </div>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-md px-5 py-2.5 rounded-full mb-8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
          <span className="text-xs font-bold tracking-widest uppercase text-blue-200">The Future of Learning is Here</span>
        </div>
        
        <h1 className="text-6xl sm:text-7xl lg:text-[6rem] font-black tracking-tighter leading-[1.05] mb-8 drop-shadow-2xl">
          Learn anything.<br />
          <span className="relative inline-block pb-2">
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Master everything.</span>
            <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-blue-500/40 to-purple-500/40 blur-lg rounded-full"></div>
          </span>
        </h1>
        
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed mb-12 font-medium drop-shadow-md">
          UronAI autonomously turns any YouTube playlist or topic into a structured, gamified 3D skill tree. Adaptive assessments ensure you actually understand the material.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
          <Link href="/auth/register"
            className="w-full sm:w-auto relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 border border-white/20 text-white font-black text-lg px-10 py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] transform transition-transform duration-300 group-hover:scale-105">
              Launch Your Arena <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          <Link href="/auth/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold px-10 py-5 rounded-2xl transition-all text-lg shadow-xl"
          >
            Sign In <ChevronRight size={22} className="text-gray-400" />
          </Link>
        </div>

        <div className="mt-16 flex items-center justify-center gap-8 text-sm font-semibold text-gray-500">
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> No credit card required</div>
          <div className="flex items-center gap-2"><Star size={16} className="text-amber-400" fill="currentColor" /> Powered by Gemini API</div>
        </div>
      </section>

      {/* 3D Glassmorphic Features Carousel */}
      <section className="relative px-6 py-24 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 relative">
             <h2 className="text-4xl sm:text-5xl font-black mb-4">A complete ecosystem.</h2>
             <p className="text-gray-400 text-lg">We replaced passive videos with a fully interactive protocol.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
            {features.map((f, i) => (
              <div key={i} className="group relative">
                {/* 3D Glow Drop */}
                <div className={`absolute -inset-1 bg-gradient-to-br ${f.color} rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
                
                {/* Glass Card */}
                <div className="relative h-full bg-[#0a0c16]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col items-start overflow-hidden">
                  
                  {/* Subtle Top Inner Highlight */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  
                  <div className={`relative w-14 h-14 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br ${f.color} shadow-lg ${f.shadow} border border-white/20 z-10`}>
                    <f.icon size={26} className="text-white drop-shadow-md" />
                  </div>
                  
                  <h3 className="text-xl font-black text-white mb-3 tracking-tight z-10">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed font-medium z-10">{f.desc}</p>
                  
                  {/* Decorative Diagonal lines inside card */}
                  <div className="absolute -bottom-24 -right-24 w-48 h-48 border border-white/5 rounded-full blur-[2px] opacity-10 group-hover:scale-150 transition-transform duration-1000"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Luxury CTA */}
      <section className="relative px-6 py-32 z-10">
        <div className="max-w-5xl mx-auto relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-[3rem] blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
          <div className="relative bg-[#0d1126]/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 sm:p-20 text-center overflow-hidden shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]">
            <div className="absolute -top-[50%] -left-[10%] w-[50%] h-[150%] bg-white/5 transform rotate-12 pointer-events-none"></div>
            
            <Zap size={40} className="mx-auto text-blue-400 mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight drop-shadow-xl text-white">Your ultimate brain upgrade awaits.</h2>
            <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto font-medium">Join the next generation of accelerated learners. Generate your first AI course in seconds.</p>
            
            <Link href="/auth/register" className="inline-block relative group/btn">
              <span className="absolute inset-0 bg-gradient-to-r from-white to-gray-300 rounded-2xl blur-md opacity-50 group-hover/btn:opacity-100 transition-opacity duration-300"></span>
              <div className="relative bg-white text-gray-900 font-black text-lg px-12 py-5 rounded-2xl flex items-center gap-3 border border-white/20 shadow-2xl transform transition-transform duration-300 group-hover/btn:scale-[1.03]">
                Create Free Account <ArrowRight size={22} className="group-hover/btn:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 px-6 py-12 text-center z-10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-black text-xs">U</div>
          <span className="font-black tracking-tight text-white">uron<span className="text-blue-400">ai</span></span>
        </div>
        <p className="text-gray-600 text-sm font-medium tracking-wide">© {new Date().getFullYear()} URON AI VENTURES. DESIGNED FOR THE FUTURE.</p>
      </footer>
    </div>
  );
}
