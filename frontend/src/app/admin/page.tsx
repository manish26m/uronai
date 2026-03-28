"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Users, Trophy, Map, TrendingUp, ChevronDown, ChevronRight } from "lucide-react";

interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  total_xp: number;
  missions: number;
  subjects: {
    id: string;
    title: string;
    progress_percentage: number;
    xp: number;
    level: number;
    nodes: any[];
  }[];
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      if ((session.user as any)?.role !== "admin") { router.push("/dashboard"); return; }
      fetchUsers();
    }
  }, [status]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = (session as any)?.backendToken;
      const res = await fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUsers(await res.json());
    } finally { setLoading(false); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const totalXP = users.reduce((sum, u) => sum + u.total_xp, 0);
  const totalMissions = users.reduce((sum, u) => sum + u.missions, 0);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin text-red-500" size={40} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Admin Dashboard</h1>
        <p className="text-gray-500">Monitor every learner&apos;s growth and mission progress.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Learners", value: totalUsers, icon: Users, color: "blue" },
          { label: "Total XP Earned", value: totalXP.toLocaleString(), icon: Trophy, color: "yellow" },
          { label: "Active Missions", value: totalMissions, icon: Map, color: "purple" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center gap-4`}>
            <div className={`p-3 bg-${color}-500/10 text-${color}-400 rounded-xl border border-${color}-500/20`}><Icon size={24} /></div>
            <div>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">{label}</p>
              <p className="text-3xl font-black text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full bg-gray-900 border border-gray-800 focus:border-red-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition text-sm"
        />
      </div>

      {/* User Table */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Users size={40} className="mx-auto mb-3 text-gray-700" />
            <p>No learners found.</p>
          </div>
        )}
        {filtered.map(user => (
          <div key={user.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden transition hover:border-gray-700">
            <button
              onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-800/30 transition"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : user.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white">{user.name || "Unnamed"}</p>
                <p className="text-gray-500 text-sm truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">XP</p>
                  <p className="text-white font-bold">{user.total_xp}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">Missions</p>
                  <p className="text-white font-bold">{user.missions}</p>
                </div>
                <div className="w-24">
                  <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Progress</p>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-600 to-amber-600 rounded-full"
                      style={{ width: user.subjects.length > 0 ? `${Math.round(user.subjects.reduce((s, m) => s + m.progress_percentage, 0) / user.subjects.length)}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
              {expandedUser === user.id ? <ChevronDown size={18} className="text-gray-500 flex-shrink-0" /> : <ChevronRight size={18} className="text-gray-500 flex-shrink-0" />}
            </button>

            {expandedUser === user.id && (
              <div className="px-5 pb-5 border-t border-gray-800">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 mt-4">Active Missions</p>
                {user.subjects.length === 0 ? (
                  <p className="text-gray-600 text-sm italic">No missions created yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {user.subjects.map(s => (
                      <div key={s.id} className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-sm text-white line-clamp-1">{s.title}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold">Lv {s.level}</span>
                            <span className="text-xs text-gray-500">{s.xp} XP</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <TrendingUp size={12} /> {s.progress_percentage}% complete • {s.nodes?.length || 0} nodes
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-red-600 to-amber-600 rounded-full transition-all" style={{ width: `${s.progress_percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
