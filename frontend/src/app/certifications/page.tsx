"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Award, Clock, Loader2, ShieldCheck, Sparkles, ChevronRight, Info } from "lucide-react";

interface Certification {
  id: number;
  provider: string;
  name: string;
  timeline: string;
  match: number;
}

const providerColors: Record<string, { bg: string; text: string; border: string }> = {
  AWS: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  Google: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  Microsoft: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
  CompTIA: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  default: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
};

export default function CertificationsPage() {
  const { data: session } = useSession();
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const token = (session as any)?.backendToken;

  useEffect(() => {
    fetch(`${apiUrl}/certifications`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => { setCerts(d); setLoading(false); })
      .catch(() => {
        setCerts([
          { id: 1, provider: "AWS", name: "AWS Certified Cloud Practitioner", timeline: "3 weeks", match: 75 },
          { id: 2, provider: "Google", name: "Google Data Analytics Professional Certificate", timeline: "2 months", match: 90 },
          { id: 3, provider: "Microsoft", name: "Azure Fundamentals (AZ-900)", timeline: "4 weeks", match: 60 },
          { id: 4, provider: "CompTIA", name: "CompTIA A+ Core Series", timeline: "6 weeks", match: 40 },
        ]);
        setLoading(false);
      });
  }, [token]);

  const sortedCerts = [...certs].sort((a, b) => b.match - a.match);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900/30 via-orange-900/20 to-gray-950 border border-amber-800/30 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.12),transparent_70%)] pointer-events-none" />
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-amber-500/15 text-amber-400 rounded-2xl border border-amber-500/20">
            <Award size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Certification Engine</h1>
            <p className="text-amber-400/70 text-sm">Powered by Gemini AI</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm max-w-xl">Discover industry-recognized certifications that perfectly match your current skill level. Higher match = closer to ready.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500 gap-4">
          <Loader2 className="animate-spin text-amber-500" size={48} />
          <p className="text-sm font-medium animate-pulse">Matching certifications to your profile...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCerts.map((cert, i) => {
            const p = providerColors[cert.provider] || providerColors.default;
            const matchColor = cert.match >= 75 ? "text-green-400 bg-green-500/10 border-green-500/20"
              : cert.match >= 50 ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
              : "text-red-400 bg-red-500/10 border-red-500/20";
            const barColor = cert.match >= 75 ? "from-green-500 to-emerald-400"
              : cert.match >= 50 ? "from-yellow-500 to-orange-400"
              : "from-red-500 to-rose-400";

            return (
              <div key={cert.id}
                className="group bg-gray-900/80 border border-gray-800 hover:border-amber-500/20 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-900/10"
              >
                {/* Top bar */}
                <div className="h-0.5 w-full bg-gray-800">
                  <div className={`h-full bg-gradient-to-r ${barColor} transition-all duration-700`} style={{ width: `${cert.match}%` }} />
                </div>

                <div className="p-5 flex flex-col md:flex-row md:items-center gap-5">
                  {/* Provider badge */}
                  <div className={`shrink-0 w-16 h-16 rounded-2xl border ${p.border} ${p.bg} flex items-center justify-center text-xs font-black ${p.text}`}>
                    {cert.provider}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-lg leading-tight">{cert.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock size={12} /> {cert.timeline}
                      </span>
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${matchColor}`}>
                        <ShieldCheck size={12} /> {cert.match}% match
                      </span>
                      {i === 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <Sparkles size={12} /> Best Match
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${barColor} rounded-full`} style={{ width: `${cert.match}%` }} />
                      </div>
                      <span className="text-gray-600 text-xs w-12 text-right">{cert.match}% ready</span>
                    </div>
                  </div>

                  <button className="shrink-0 flex items-center gap-2 bg-amber-600/80 hover:bg-amber-500 text-white text-sm px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-amber-900/30 whitespace-nowrap">
                    View Plan <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && (
        <div className="flex items-start gap-4 bg-red-900/10 border border-red-800/20 rounded-2xl p-5">
          <Info size={17} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Why get certified?</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Industry certifications from AWS, Google, and Microsoft act as standardized benchmarks that instantly signal competence to recruiters. Your <span className="text-amber-400 font-bold">Skill Match</span> shows how much curriculum you've already covered in UronAI.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
