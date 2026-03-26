"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, Map, Brain, LogOut, Shield, User, ChevronRight, Sparkles } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subjects", label: "Missions",   icon: Map },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  return (
    <aside className="h-full bg-gray-950/80 backdrop-blur-xl border-r border-gray-800/50 flex flex-col py-6 px-4">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 mb-10 px-2">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-900/50">U</div>
        <span className="text-xl font-black tracking-tight">uron<span className="text-blue-400">ai</span></span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${active ? "bg-blue-600/15 text-blue-400 border border-blue-500/20" : "text-gray-500 hover:text-white hover:bg-gray-900"}`}
            >
              <Icon size={18} className={active ? "text-blue-400" : "text-gray-600 group-hover:text-gray-300"} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto text-blue-400/60" />}
            </Link>
          );
        })}

        {isAdmin && (
          <Link href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${pathname.startsWith("/admin") ? "bg-purple-600/15 text-purple-400 border border-purple-500/20" : "text-gray-500 hover:text-white hover:bg-gray-900"}`}
          >
            <Shield size={18} className="text-purple-400" />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* Upgrade Card */}
      <div className="mb-4 bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-800/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-blue-400 mb-1">
          <Sparkles size={14} /> <span className="text-xs font-bold uppercase tracking-wider">AI Powered</span>
        </div>
        <p className="text-gray-400 text-xs">Adaptive quizzes, YouTube integration & AI mentorship.</p>
      </div>

      {/* User */}
      {session?.user && (
        <div className="border-t border-gray-800/50 pt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            {session.user.image ? (
              <img src={session.user.image} className="w-8 h-8 rounded-full ring-2 ring-blue-500/30" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <User size={14} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{session.user.name || "Learner"}</p>
              <p className="text-gray-500 text-xs truncate">{session.user.email}</p>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm px-3 py-2 rounded-lg hover:bg-red-950/20 transition"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
