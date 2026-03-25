"use client";

import { useEffect, useState } from "react";
import { Award, Clock, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

interface Certification {
  id: number;
  provider: string;
  name: string;
  timeline: string;
  match: number;
}

export default function CertificationsPage() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/certifications')
      .then(res => res.json())
      .then(data => {
        setCerts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        // Fallback mock
        setCerts([
          { id: 1, provider: "AWS", name: "AWS Certified Cloud Practitioner", timeline: "3 weeks", match: 75 },
          { id: 2, provider: "Google", name: "Google Data Analytics Professional Certificate", timeline: "2 months", match: 90 },
          { id: 3, provider: "Microsoft", name: "Azure Fundamentals (AZ-900)", timeline: "4 weeks", match: 60 }
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-amber-500/20 text-amber-500 p-2 rounded-lg">
            <Award size={28} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Certification Engine</h2>
        </div>
        <p className="text-gray-400">Discover industry-recognized certifications that match your current skillset.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-gray-400">
          <Loader2 className="animate-spin mb-4 text-amber-500" size={40} />
          <p>Finding the best certifications for your profile...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {certs.map((cert) => (
            <div key={cert.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-amber-500/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="bg-gray-800 p-3 rounded-xl min-w-[64px] flex items-center justify-center font-bold text-lg border border-gray-700">
                  {cert.provider}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1 group-hover:text-amber-400 transition-colors">{cert.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={16} /> Estimated: {cert.timeline}
                    </span>
                    <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <ShieldCheck size={16} /> Skill Match: {cert.match}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col md:items-end gap-3">
                <div className="w-full md:w-48 bg-gray-800 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-amber-500" 
                    style={{ width: `${cert.match}%` }}
                  />
                </div>
                <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-white hover:bg-gray-200 text-black px-6 py-2 rounded-lg font-bold transition-colors">
                  View Setup Plan <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="bg-gray-900 border border-t-4 border-t-amber-500 border-gray-800 p-6 rounded-xl mt-8">
        <h3 className="font-bold text-lg mb-2 text-white">Why Certifications?</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          While your project portfolio demonstrates what you can build, industry certifications from providers like AWS, Google, and Microsoft act as standard benchmarks that instantly signal to recruiters that you meet a foundational baseline of technical competence. Your "Skill Match" percentage tells you how much of the required curriculum you have already covered in the AI Learning OS.
        </p>
      </div>
    </div>
  );
}
