import Link from "next/link";
import { ArrowRight, Brain, Zap, Trophy, Users, Map, ChevronRight } from "lucide-react";

export default function LandingPage() {
  const features = [
    { icon: Brain, title: "AI-Generated Roadmaps", desc: "Describe your goal. The AI builds a personalized skill tree tailored exactly to you.", color: "blue" },
    { icon: Zap, title: "Adaptive Assessments", desc: "Quizzes generated from real YouTube video transcripts — tests what you actually watched.", color: "yellow" },
    { icon: Trophy, title: "XP & Leveling System", desc: "Earn XP for every completed module. Level up and watch your skill tree expand dynamically.", color: "purple" },
    { icon: Map, title: "Living Skill Tree", desc: "Your roadmap evolves. Fail a test? New remedial nodes appear automatically.", color: "green" },
  ];

  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-[#080810]/80 backdrop-blur-xl border-b border-gray-800/30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-900/50">U</div>
          <span className="text-xl font-black tracking-tight">uron<span className="text-blue-400">ai</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-gray-400 hover:text-white text-sm font-medium transition">Sign In</Link>
          <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-blue-900/40">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-40 pb-32 overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 bg-blue-950/50 border border-blue-800/50 text-blue-400 text-xs font-bold px-4 py-2 rounded-full mb-8 relative z-10">
          <Zap size={12} /> NEXT-GEN ADAPTIVE LEARNING PLATFORM
        </div>
        <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-6 leading-tight relative z-10">
          Learn smarter with<br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            AI that adapts to you
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed relative z-10">
          UronAI builds a personalized learning roadmap from your goal, teaches via real YouTube tutorials, and generates assessments from the actual video content — so you learn, not memorize.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <Link href="/auth/register"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-blue-900/40 hover:shadow-blue-900/60 hover:scale-105 text-lg"
          >
            Start Learning Free <ArrowRight size={20} />
          </Link>
          <Link href="/auth/login"
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white font-bold px-8 py-4 rounded-2xl transition-all text-lg"
          >
            Sign In <ChevronRight size={20} />
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-6 mt-12 text-gray-500 text-sm relative z-10">
          <div className="flex items-center gap-2"><Users size={16} /><span>Join thousands of learners</span></div>
          <div className="w-px h-4 bg-gray-700" />
          <div className="flex items-center gap-2"><Trophy size={16} /><span>AI-powered assessments</span></div>
          <div className="w-px h-4 bg-gray-700" />
          <div className="flex items-center gap-2"><Map size={16} /><span>Dynamic skill trees</span></div>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 pb-32 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4">Everything you need to master anything</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">Not another passive learning platform. UronAI actively adapts to how you perform.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className={`group bg-gray-900/50 border border-gray-800 hover:border-${color}-500/30 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-${color}-900/10`}>
              <div className={`w-12 h-12 bg-${color}-500/10 text-${color}-400 rounded-xl flex items-center justify-center mb-5 border border-${color}-500/20`}>
                <Icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
              <p className="text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 pb-24 text-center">
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-800/30 rounded-3xl p-16">
          <h2 className="text-4xl font-black mb-4">Ready to learn differently?</h2>
          <p className="text-gray-400 mb-8 text-lg">Create your free account and let AI build your first personalized roadmap in 60 seconds.</p>
          <Link href="/auth/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold px-10 py-4 rounded-2xl transition-all shadow-2xl shadow-blue-900/40 text-lg hover:scale-105"
          >
            Get Started Free <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-800/50 px-8 py-8 text-center text-gray-600 text-sm">
        <span>© 2024 UronAI — Next-Gen Adaptive Learning Platform</span>
      </footer>
    </div>
  );
}
