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

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className="h-full bg-[#0c0505]/80 backdrop-blur-3xl border-r border-white/5 flex flex-col py-8 px-5">
      {/* Logo */}
      <Link href="/dashboard" onClick={handleLinkClick} className="flex items-center gap-3 mb-10 px-2 group">
        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-amber-600 rounded-[14px] flex items-center justify-center text-white font-black text-xl shadow-xl shadow-red-900/40 group-hover:scale-110 transition-transform duration-500">U</div>
        <span className="text-2xl font-black tracking-tight">uron<span className="text-red-500">ai</span></span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={handleLinkClick}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group ${active ? "bg-red-600/10 text-red-500 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
            >
              <Icon size={20} className={active ? "text-red-500" : "text-gray-600 group-hover:text-gray-300"} />
              {label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />}
            </Link>
          );
        })}

        {isAdmin && (
          <Link href="/admin" onClick={handleLinkClick}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group ${pathname.startsWith("/admin") ? "bg-amber-600/10 text-amber-400 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
          >
            <Shield size={20} className="text-amber-400" />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* Upgrade Card */}
      <div className="mb-6 bg-gradient-to-br from-red-950/40 to-amber-950/20 border border-white/5 rounded-[20px] p-5 relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors" />
        <div className="flex items-center gap-2 text-amber-500 mb-2">
          <Sparkles size={14} className="animate-pulse" /> <span className="text-[10px] font-black uppercase tracking-[0.2em]">Premium AI</span>
        </div>
        <p className="text-gray-400 text-[11px] leading-relaxed">Unlock the full potential of adaptive neural learning.</p>
      </div>

      {/* User */}
      {session?.user && (
        <div className="border-t border-white/5 pt-6">
          <div className="flex items-center gap-3 px-2 mb-4">
            {session.user.image ? (
              <img src={session.user.image} className="w-10 h-10 rounded-full ring-2 ring-red-500/20 shadow-lg shadow-black" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-red-950/50">
                <User size={18} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate">{session.user.name || "Learner"}</p>
              <p className="text-gray-500 text-[10px] font-medium truncate opacity-60">{session.user.email}</p>
            </div>
          </div>
          <button onClick={() => { handleLinkClick(); signOut({ callbackUrl: "/" }); }}
            className="w-full flex items-center gap-2 text-gray-500 hover:text-red-500 font-bold text-xs px-4 py-3 rounded-xl hover:bg-red-500/5 transition-all"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
