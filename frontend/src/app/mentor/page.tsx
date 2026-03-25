"use client";

import { useState, useEffect } from "react";
import { BrainCircuit, AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface MentorAdvice {
  daily_plan: string[];
  weakness_detection: string;
  next_step: string;
}

export default function MentorPage() {
  const [advice, setAdvice] = useState<MentorAdvice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app we'd fetch this from our FastAPI backend
    fetch('http://127.0.0.1:8000/mentor/advice')
      .then(res => res.json())
      .then(data => {
        setAdvice(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch advice", err);
        // Fallback for UI testing
        setAdvice({
          daily_plan: ["Review Python OOP (45 mins)", "Complete React Hooks (60 mins)", "SQL Joins Quiz (15 mins)"],
          weakness_detection: "You are weak in Object-Oriented Programming (OOP). Practice classes and inheritance before moving ahead.",
          next_step: "Take the OOP fundamentals quiz."
        });
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-500/20 text-blue-500 p-2 rounded-lg">
            <BrainCircuit size={28} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">AI Mentor</h2>
        </div>
        <p className="text-gray-400">Your personal OS brain. It analyzes your progress and tells you exactly what to do next.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-gray-400">
          <Loader2 className="animate-spin mb-4 text-blue-500" size={40} />
          <p>Analyzing your learning patterns...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="bg-gray-900 border border-t-4 border-t-red-500 border-gray-800 p-6 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertTriangle size={120} />
            </div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-red-500/10 text-red-500 p-3 rounded-full mt-1">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Weakness Detected</h3>
                <p className="text-gray-300 text-lg leading-relaxed">{advice?.weakness_detection}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-t-4 border-t-blue-500 border-gray-800 p-6 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="bg-blue-500/10 text-blue-500 p-3 rounded-full mt-1">
                <BrainCircuit size={24} />
              </div>
              <div className="w-full">
                <h3 className="text-xl font-bold mb-4">Today's Optimized Plan</h3>
                <div className="space-y-3">
                  {advice?.daily_plan.map((plan, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-950 rounded-lg border border-gray-800">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-gray-600" size={20} />
                        <span className="font-medium text-gray-200">{plan}</span>
                      </div>
                      <button className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md transition-colors text-white font-medium">
                        Start
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 p-6 rounded-xl">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-blue-400 mb-2">Strategic Next Step</h3>
            <p className="text-2xl font-bold mb-4">{advice?.next_step}</p>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors w-max">
              Execute Next Step <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
