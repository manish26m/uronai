"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, Map, Brain, LogOut, Shield, User, ChevronRight, Sparkles, Settings, Briefcase, Award } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subjects",  label: "Missions",    icon: Map },
  { href: "/mentor",    label: "AI Mentor",   icon: Brain },
  { href: "/careers",   label: "Careers",     icon: Briefcase },
  { href: "/certifications", label: "Certs",   icon: Award },
  { href: "/settings",  label: "Settings",    icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  return (
    <aside className="h-full bg-gray-950/80 backdrop-blur-xl border-r border-gray-800/50 flex flex-col py-6 px-4">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 mb-10 px-2">
        <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-amber-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-900/50">U</div>
        <span className="text-xl font-black tracking-tight">uron<span className="text-red-400">ai</span></span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${active ? "bg-red-600/15 text-red-400 border border-red-500/20" : "text-gray-500 hover:text-white hover:bg-gray-900"}`}
            >
              <Icon size={18} className={active ? "text-red-400" : "text-gray-600 group-hover:text-gray-300"} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto text-red-400/60" />}
            </Link>
          );
        })}

        {isAdmin && (
          <Link href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${pathname.startsWith("/admin") ? "bg-amber-600/15 text-amber-400 border border-amber-500/20" : "text-gray-500 hover:text-white hover:bg-gray-900"}`}
          >
            <Shield size={18} className="text-amber-400" />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* Upgrade Card */}
      <div className="mb-4 bg-gradient-to-br from-red-900/30 to-amber-900/20 border border-red-800/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-red-400 mb-1">
          <Sparkles size={14} /> <span className="text-xs font-bold uppercase tracking-wider">AI Powered</span>
        </div>
        <p className="text-gray-400 text-xs">Adaptive quizzes, YouTube integration & AI mentorship.</p>
      </div>

      {/* User */}
      {session?.user && (
        <div className="border-t border-gray-800/50 pt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            {session.user.image ? (
              <img src={session.user.image} className="w-8 h-8 rounded-full ring-2 ring-red-500/30" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center">
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
