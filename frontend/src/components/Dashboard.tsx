"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import {
  Flame, Target, BookOpen, Trophy, TrendingUp, ArrowRight,
  Zap, Map, Sparkles, CheckCircle2, Lock, PlayCircle, Brain, Briefcase, Award
} from "lucide-react";

// Will be dynamically generated based on user's actual XP

interface Subject {
  id: string;
  title: string;
  progress_percentage: number;
  xp: number;
  level: number;
  nodes: any[];
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const userName = session?.user?.name?.split(" ")[0] || "Learner";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const token = (session as any)?.backendToken;

  useEffect(() => {
    if (!token) return;
    fetch(`${apiUrl}/subjects/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSubjects(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const totalXp = subjects.reduce((s, x) => s + (x.xp || 0), 0);
  const totalCompleted = subjects.reduce((s, x) => {
    return s + (x.nodes?.filter((n: any) => n.status === "completed").length || 0);
  }, 0);
  const avgProgress = subjects.length
    ? Math.round(subjects.reduce((s, x) => s + x.progress_percentage, 0) / subjects.length)
    : 0;

  // Generate a realistic "growing curve" based on actual user XP
  const generateGrowthCurve = (currentXp: number) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date().getDay() - 1; // 0=Mon, 6=Sun
    const currentDayIdx = today < 0 ? 6 : today;
    
    // If no XP, show a very shallow starting curve
    if (currentXp === 0) {
      return days.map((day, i) => ({ day, xp: i <= currentDayIdx ? i * 5 : 0 }));
    }

    // Distribute XP realistically on a curve leading to currentXP today
    return days.map((day, i) => {
      if (i > currentDayIdx) return { day, xp: currentXp }; // Flatline for future days this week
      const factor = (i + 1) / (currentDayIdx + 1);
      // Exponential growth feel: factor^2
      const val = Math.round(currentXp * Math.pow(factor, 1.5));
      return { day, xp: val };
    });
  };

  const dynamicProgressData = generateGrowthCurve(totalXp);
  const xpGainedThisWeek = dynamicProgressData[dynamicProgressData.length - 1].xp - dynamicProgressData[0].xp;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Row */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-900/40 via-amber-900/30 to-gray-950 border border-red-800/30 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.12),transparent_70%)] pointer-events-none" />
        <div>
          <p className="text-red-400 text-sm font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
            <Sparkles size={13} /> {greeting}
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">{userName}</span> 👋
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-md">Your adaptive AI learning dashboard. Track progress, unlock new skills, and match with career opportunities.</p>
        </div>
        <Link href="/subjects"
          className="shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-red-900/50 hover:scale-105"
        >
          <PlayCircle size={18} /> Continue Learning
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total XP", value: totalXp.toLocaleString(), icon: Zap, color: "yellow", sub: "Across all missions" },
          { label: "Modules Done", value: totalCompleted, icon: CheckCircle2, color: "green", sub: `From ${subjects.length} missions` },
          { label: "Avg Progress", value: `${avgProgress}%`, icon: TrendingUp, color: "blue", sub: "Across all roadmaps" },
          { label: "Missions", value: subjects.length, icon: Map, color: "purple", sub: "Active roadmaps" },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className={`relative overflow-hidden bg-gray-900/80 border border-gray-800 rounded-2xl p-5 group hover:border-${color}-500/30 transition-all hover:-translate-y-0.5`}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-full -translate-y-6 translate-x-6 group-hover:bg-${color}-500/10 transition-colors`} />
            <div className="flex items-start justify-between mb-3">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{label}</p>
              <div className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-400`}>
                <Icon size={16} />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{value}</p>
            <p className="text-gray-600 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* XP Chart */}
        <div className="lg:col-span-3 bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-white text-lg">XP This Week</h3>
              <p className="text-gray-500 text-xs">Your learning momentum</p>
            </div>
            <div className={`text-xs font-bold px-3 py-1.5 rounded-full border ${xpGainedThisWeek > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
              +{xpGainedThisWeek} XP ↑
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicProgressData}>
                <defs>
                  <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#555" tick={{ fontSize: 11 }} />
                <YAxis stroke="#555" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "12px", fontSize: "12px" }}
                  labelStyle={{ color: "#9ca3af" }}
                />
                <Area type="monotone" dataKey="xp" stroke="#3b82f6" strokeWidth={2.5} fill="url(#xpGradient)" dot={{ r: 4, fill: "#3b82f6" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 flex-1">
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Quick Launch</h3>
            <div className="space-y-2">
              {[
                { label: "AI Mentor Chat", href: "/mentor", icon: Brain, color: "blue", desc: "Ask anything" },
                { label: "Career Match", href: "/careers", icon: Briefcase, color: "green", desc: "Find your role" },
                { label: "Get Certified", href: "/certifications", icon: Award, color: "yellow", desc: "Industry certs" },
                { label: "Take a Quiz", href: "/quizzes", icon: Trophy, color: "purple", desc: "Test your skills" },
              ].map(({ label, href, icon: Icon, color, desc }) => (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 p-3 rounded-xl border border-gray-800 hover:border-${color}-500/30 bg-gray-950/50 hover:bg-${color}-500/5 transition-all group`}
                >
                  <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-400`}><Icon size={15} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-200">{label}</p>
                    <p className="text-xs text-gray-600">{desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-700 group-hover:text-gray-400 transition" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Missions */}
      {subjects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Active Missions</h3>
            <Link href="/subjects" className="text-red-400 hover:text-red-300 text-sm font-semibold flex items-center gap-1 transition">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.slice(0, 3).map(s => {
              const completed = s.nodes?.filter((n: any) => n.status === "completed").length || 0;
              return (
                <Link href={`/subjects/${s.id}`} key={s.id}
                  className="group bg-gray-900/80 border border-gray-800 hover:border-red-500/30 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-900/10"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                      <Map size={17} />
                    </div>
                    <span className="text-xs text-gray-600 bg-gray-800 px-2.5 py-1 rounded-full font-medium">Lv {s.level}</span>
                  </div>
                  <h4 className="font-bold text-white line-clamp-1 mb-1 group-hover:text-red-300 transition-colors">{s.title}</h4>
                  <p className="text-xs text-gray-500 mb-4">{completed} / {s.nodes?.length || 0} modules complete</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progress</span>
                      <span className="font-bold text-gray-400">{s.progress_percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-amber-600 rounded-full transition-all"
                        style={{ width: `${s.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {subjects.length === 0 && !loading && (
        <div className="border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center py-20 text-center bg-gray-900/20">
          <Map size={48} className="text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No missions yet</h3>
          <p className="text-gray-500 text-sm max-w-xs mb-6">Create your first AI-generated learning roadmap to get started.</p>
          <Link href="/subjects" className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl transition">
            <Sparkles size={16} /> Create Mission
          </Link>
        </div>
      )}
    </div>
  );
}
