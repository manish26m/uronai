"use client";

import { useEffect, useState } from "react";
import { Briefcase, Target, TrendingUp, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

interface CareerMatch {
  id: number;
  role: string;
  readiness: number;
  missing_skills: string[];
  growth_roadmap: string;
}

export default function CareersPage() {
  const [matches, setMatches] = useState<CareerMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/careers/matching')
      .then(res => res.json())
      .then(data => {
        setMatches(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        // Fallback mock
        setMatches([
          { id: 1, role: "Python Developer", readiness: 85, missing_skills: ["FastAPI", "Docker"], growth_roadmap: "Focus on backend fundamentals and containerization." },
          { id: 2, role: "Data Analyst", readiness: 60, missing_skills: ["Pandas", "SQL Joins", "Tableau"], growth_roadmap: "Complete the 'Introduction to Pandas' subject playlist." },
          { id: 3, role: "ML Engineer", readiness: 20, missing_skills: ["PyTorch", "Calculus", "ML Ops"], growth_roadmap: "Start with mathematical foundations before approaching Deep Learning." }
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-emerald-500/20 text-emerald-500 p-2 rounded-lg">
            <Briefcase size={28} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Career Match Engine</h2>
        </div>
        <p className="text-gray-400">Your current learning trajectory matched against real-world job roles.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-gray-400">
          <Loader2 className="animate-spin mb-4 text-emerald-500" size={40} />
          <p>Analyzing your skills against current market demands...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {matches.map((match) => (
            <div key={match.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg p-6 relative group hover:border-emerald-500/30 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold">{match.role}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Target size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Readiness Score</span>
                  </div>
                </div>
                
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${match.readiness > 75 ? 'border-green-500 text-green-500 bg-green-500/10' : match.readiness > 50 ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 'border-red-500 text-red-500 bg-red-500/10'}`}>
                  <span className="font-bold text-xl">{match.readiness}%</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={16} className="text-orange-500" />
                    <h4 className="text-sm font-semibold text-gray-200">Missing Skills</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {match.missing_skills.map((skill, idx) => (
                      <span key={idx} className="bg-gray-800 text-gray-300 px-2 py-1 text-xs rounded-md border border-gray-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-blue-500" />
                    <h4 className="text-sm font-semibold text-blue-400">Growth Roadmap</h4>
                  </div>
                  <p className="text-sm text-gray-300">{match.growth_roadmap}</p>
                </div>
              </div>

              <button className="mt-6 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors">
                View Job Listings <ArrowRight size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
