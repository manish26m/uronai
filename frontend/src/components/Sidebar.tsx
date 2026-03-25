import { Home, Library, BarChart2, Brain, Briefcase, Award, HelpCircle } from "lucide-react";
import Link from 'next/link';

export default function Sidebar() {
  return (
    <div className="h-screen w-64 bg-gray-900 text-white flex flex-col p-4 fixed left-0 top-0">
      <div className="flex items-center gap-2 mb-10 mt-4 px-2">
        <Brain className="w-8 h-8 text-blue-500" />
        <h1 className="text-xl font-bold tracking-tight">Learning OS</h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        <SidebarItem icon={<Home size={20} />} label="Home" href="/" />
        <SidebarItem icon={<Library size={20} />} label="Subjects" href="/subjects" />
        <SidebarItem icon={<BarChart2 size={20} />} label="Analytics" href="/analytics" />
        <SidebarItem icon={<Brain size={20} />} label="AI Mentor" href="/mentor" />
        <SidebarItem icon={<HelpCircle size={20} />} label="AI Quizzes" href="/quizzes" />
        <div className="pt-4 pb-2">
          <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Career Focus</p>
        </div>
        <SidebarItem icon={<Briefcase size={20} />} label="Careers" href="/careers" />
        <SidebarItem icon={<Award size={20} />} label="Certifications" href="/certifications" />
      </nav>
      
      <div className="mt-auto p-4 bg-gray-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
            U
          </div>
          <div>
            <p className="text-sm font-medium">User Profile</p>
            <p className="text-xs text-gray-400">Level 5 Learner</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, href, active = false }: { icon: React.ReactNode, label: string, href: string, active?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
      {icon}
      <span className="font-medium">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>}
    </Link>
  );
}
