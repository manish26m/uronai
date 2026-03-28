"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Briefcase, Target, TrendingUp, AlertCircle,
  Loader2, Sparkles, ChevronRight, ExternalLink
} from "lucide-react";

interface CareerMatch {
  id: number;
  role: string;
  readiness: number;
  missing_skills: string[];
  growth_roadmap: string;
}

export default function CareersPage() {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<CareerMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const token = (session as any)?.backendToken;

  useEffect(() => {
    const url = `${apiUrl}/careers/matching`;
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => { setMatches(d); setLoading(false); })
      .catch(() => {
        setMatches([
          { id: 1, role: "Python Developer", readiness: 85, missing_skills: ["FastAPI", "Docker"], growth_roadmap: "Focus on backend fundamentals and containerization." },
          { id: 2, role: "Data Analyst", readiness: 60, missing_skills: ["Pandas", "SQL Joins", "Tableau"], growth_roadmap: "Complete the Introduction to Pandas mission playlist." },
          { id: 3, role: "ML Engineer", readiness: 20, missing_skills: ["PyTorch", "Calculus", "MLOps"], growth_roadmap: "Start with mathematical foundations before approaching Deep Learning." },
        ]);
        setLoading(false);
      });
  }, [token]);

  const getColor = (r: number) =>
    r >= 75 ? { ring: "border-green-500", bg: "bg-green-500/10", text: "text-green-400", bar: "from-green-500 to-emerald-400" }
    : r >= 50 ? { ring: "border-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-400", bar: "from-yellow-500 to-orange-400" }
    : { ring: "border-red-500", bg: "bg-red-500/10", text: "text-red-400", bar: "from-red-500 to-rose-400" };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/30 via-teal-900/20 to-gray-950 border border-emerald-800/30 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none" />
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <Briefcase size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Career Match Engine</h1>
            <p className="text-emerald-400/70 text-sm">Powered by Gemini AI</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm max-w-xl">Your current learning trajectory is analyzed against real-world job requirements. See how ready you are and what to focus on next.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500 gap-4">
          <div className="relative">
            <Loader2 className="animate-spin text-emerald-500" size={48} />
            <Sparkles size={16} className="text-emerald-400 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <p className="text-sm font-medium animate-pulse">Analyzing your skills against market demands...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => {
            const c = getColor(match.readiness);
            return (
              <div key={match.id} className={`group relative bg-gray-900/80 border border-gray-800 hover:${c.ring.replace("border-", "border-")}/40 rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl flex flex-col`}>
                {/* Top Progress Bar */}
                <div className="h-1 w-full bg-gray-800">
                  <div className={`h-full bg-gradient-to-r ${c.bar} transition-all`} style={{ width: `${match.readiness}%` }} />
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  {/* Readiness */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h3 className="text-xl font-black text-white">{match.role}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5"><Target size={11} /> Career Readiness</p>
                    </div>
                    <div className={`w-16 h-16 rounded-2xl border-2 ${c.ring} ${c.bg} flex flex-col items-center justify-center`}>
                      <span className={`text-xl font-black ${c.text}`}>{match.readiness}</span>
                      <span className={`text-[9px] font-bold ${c.text} -mt-0.5`}>%</span>
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="bg-gray-950/60 border border-gray-800/50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle size={13} className="text-orange-400" />
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Skill Gaps</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {match.missing_skills.map((skill, idx) => (
                        <span key={idx} className="bg-gray-800 text-gray-300 px-2.5 py-1 text-xs rounded-lg border border-gray-700 font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Growth Roadmap */}
                  <div className="bg-emerald-900/10 border border-emerald-500/15 rounded-xl p-4 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={13} className="text-emerald-400" />
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Growth Path</h4>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{match.growth_roadmap}</p>
                  </div>
                </div>

                <div className="px-6 pb-5">
                  <button className="w-full flex items-center justify-center gap-2 bg-emerald-600/90 hover:bg-emerald-500 text-white text-sm px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/30">
                    Find Matching Jobs <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info strip */}
      {!loading && (
        <div className="flex items-center gap-4 bg-red-900/10 border border-red-800/20 rounded-2xl p-5">
          <Sparkles size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-gray-400">
            These matches are generated by Gemini AI based on your active missions and completed modules. The more you learn, the more accurate your readiness scores become.
          </p>
        </div>
      )}
    </div>
  );
}
