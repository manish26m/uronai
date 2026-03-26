"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Plus, X, ArrowRight, Loader2, Sparkles, Zap, Brain, Briefcase, Trophy, Trash2, Map, ChevronRight } from "lucide-react";
import Flowchart from "@/components/Flowchart";
import { Node, Edge } from "@xyflow/react";

interface Subject {
  id: string;
  title: string;
  description?: string;
  progress_percentage: number;
  xp: number;
  level: number;
  nodes: any[];
  edges: any[];
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  duration: string;
  modules: string[];
}

const pathIcons: Record<string, any> = { fast: Zap, foundation: Brain, career: Briefcase };
const pathColors: Record<string, string> = {
  fast: "border-yellow-500/50 hover:border-yellow-400 bg-yellow-500/5",
  foundation: "border-blue-500/50 hover:border-blue-400 bg-blue-500/5",
  career: "border-green-500/50 hover:border-green-400 bg-green-500/5",
};
const pathGlow: Record<string, string> = {
  fast: "shadow-yellow-900/30",
  foundation: "shadow-blue-900/30",
  career: "shadow-green-900/30",
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<"goal" | "paths" | "preview" | "saving">("goal");
  const [goalInput, setGoalInput] = useState("");
  const [aiPaths, setAiPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [previewNodes, setPreviewNodes] = useState<Node[]>([]);
  const [previewEdges, setPreviewEdges] = useState<Edge[]>([]);
  const [previewTitle, setPreviewTitle] = useState("");
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardError, setWizardError] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/subjects/`);
      if (res.ok) setSubjects(await res.json());
    } finally { setLoading(false); }
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;
    setWizardLoading(true);
    setWizardError("");
    try {
      const res = await fetch(`${apiUrl}/subjects/wizard-paths`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goalInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiPaths(data.paths);
        setWizardStep("paths");
      }
    } catch { setWizardError("AI is busy, try again!"); }
    finally { setWizardLoading(false); }
  };

  const handlePathSelect = async (path: LearningPath) => {
    setSelectedPath(path);
    setWizardLoading(true);
    setWizardError("");
    try {
      const res = await fetch(`${apiUrl}/subjects/wizard-paths`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goalInput, path: path.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewTitle(data.title);
        const rfNodes: Node[] = (data.nodes || []).map((n: any, i: number) => ({
          id: n.id, type: "custom",
          position: n.position || { x: 300 + (i % 2) * 180, y: i * 160 },
          data: { label: n.title, status: n.status || (i === 0 ? "active" : "locked"), isRoot: i === 0 }
        }));
        setPreviewNodes(rfNodes);
        setPreviewEdges(data.edges || []);
        setWizardStep("preview");
      }
    } catch { setWizardError("Failed to generate roadmap, try again!"); }
    finally { setWizardLoading(false); }
  };

  const handleSaveRoadmap = async () => {
    if (!selectedPath) return;
    setWizardStep("saving");
    try {
      const backendNodes = previewNodes.map(n => ({
        id: n.id, type: "custom",
        title: String(n.data.label),
        status: String(n.data.status || "locked"),
        position: n.position
      }));
      const res = await fetch(`${apiUrl}/subjects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: previewTitle, description: `Generated via AI Wizard — ${selectedPath.name}`, nodes: backendNodes, edges: previewEdges }),
      });
      if (res.ok) {
        await fetchSubjects();
        resetWizard();
      }
    } catch { setWizardStep("preview"); }
  };

  const resetWizard = () => {
    setShowWizard(false);
    setWizardStep("goal");
    setGoalInput("");
    setAiPaths([]);
    setSelectedPath(null);
    setPreviewNodes([]);
    setPreviewEdges([]);
    setWizardError("");
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm("Permanently delete this mission?")) return;
    await fetch(`${apiUrl}/subjects/${id}`, { method: "DELETE" });
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Mission Board</h1>
          <p className="text-gray-500 mt-2">Your adaptive learning missions, powered by AI.</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 hover:scale-105"
        >
          <Plus size={20} /> New Mission
        </button>
      </div>

      {/* Mission Cards */}
      {loading ? (
        <div className="flex justify-center py-32"><Loader2 className="animate-spin text-blue-500" size={48} /></div>
      ) : subjects.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center py-32 text-center text-gray-500 bg-gray-900/20">
          <Map size={56} className="mb-4 text-gray-700" />
          <h2 className="text-2xl font-bold text-gray-400 mb-2">No Missions Yet</h2>
          <p className="mb-6">Click &quot;New Mission&quot; and let the AI build your personalized learning roadmap.</p>
          <button onClick={() => setShowWizard(true)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition">
            <Sparkles size={18} /> Create Your First Mission
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(s => (
            <Link href={`/subjects/${s.id}`} key={s.id} className="group relative bg-gray-900 border border-gray-800 hover:border-blue-600/50 rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-xl hover:shadow-blue-900/20 hover:-translate-y-1">
              {/* Top accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                    <Map size={22} />
                  </div>
                  <button onClick={e => handleDelete(e, s.id)} className="text-gray-700 hover:text-red-500 transition-colors p-2 -mt-1 -mr-1 opacity-0 group-hover:opacity-100">
                    <Trash2 size={17} />
                  </button>
                </div>
                <h3 className="font-bold text-lg text-white mb-1 line-clamp-2 group-hover:text-blue-300 transition-colors">{s.title}</h3>
                <p className="text-gray-500 text-sm mb-4 flex-1 line-clamp-2">{s.description || "Adaptive learning roadmap"}</p>

                {/* XP + Level */}
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Level</p>
                    <p className="text-xl font-bold text-white">{s.level}</p>
                  </div>
                  <div className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">XP</p>
                    <p className="text-xl font-bold text-white">{s.xp}</p>
                  </div>
                  <div className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Nodes</p>
                    <p className="text-xl font-bold text-white">{s.nodes?.length || 0}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span><span>{s.progress_percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all" style={{ width: `${s.progress_percentage}%` }} />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-800 flex items-center gap-2 text-blue-400 text-sm font-bold group-hover:text-blue-300 transition-colors">
                Open Learning Arena <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* AI Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl"><Sparkles size={22} /></div>
                <div>
                  <h2 className="text-xl font-bold text-white">AI Mission Wizard</h2>
                  <p className="text-sm text-gray-500">
                    {wizardStep === "goal" && "Step 1 of 3 — Define your learning goal"}
                    {wizardStep === "paths" && "Step 2 of 3 — Choose your learning path"}
                    {wizardStep === "preview" && "Step 3 of 3 — Review & launch your roadmap"}
                    {wizardStep === "saving" && "Saving your mission..."}
                  </p>
                </div>
              </div>
              <button onClick={resetWizard} className="text-gray-600 hover:text-white transition p-2 rounded-lg hover:bg-gray-800">
                <X size={20} />
              </button>
            </div>

            {/* Step 1: Goal */}
            {wizardStep === "goal" && (
              <div className="flex-1 flex flex-col items-center justify-center p-12">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
                  <Brain size={32} />
                </div>
                <h3 className="text-3xl font-bold text-white mb-2 text-center">What do you want to master?</h3>
                <p className="text-gray-500 mb-10 text-center max-w-md">Describe your learning goal. The AI will analyze it and generate 3 personalized roadmap options for you.</p>
                <form onSubmit={handleGoalSubmit} className="w-full max-w-xl flex gap-3">
                  <input
                    autoFocus
                    value={goalInput}
                    onChange={e => setGoalInput(e.target.value)}
                    placeholder='e.g. "Become a Full Stack Developer in 3 months"'
                    className="flex-1 bg-gray-900 border border-gray-700 focus:border-blue-500 rounded-xl px-5 py-4 text-white text-lg focus:outline-none transition placeholder-gray-600"
                  />
                  <button type="submit" disabled={wizardLoading || !goalInput.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-blue-900/40"
                  >
                    {wizardLoading ? <Loader2 className="animate-spin" /> : <><ArrowRight size={20} /></>}
                  </button>
                </form>
                {wizardError && <p className="text-red-400 mt-4 text-sm">{wizardError}</p>}
              </div>
            )}

            {/* Step 2: Path Selection */}
            {wizardStep === "paths" && (
              <div className="flex-1 overflow-y-auto p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">AI-generated paths for:<br/><span className="text-blue-400">&quot;{goalInput}&quot;</span></h3>
                  <p className="text-gray-500">Pick the learning style that matches your personality and timeline.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {aiPaths.map(path => {
                    const Icon = pathIcons[path.id] || Sparkles;
                    return (
                      <button
                        key={path.id}
                        onClick={() => handlePathSelect(path)}
                        disabled={wizardLoading}
                        className={`text-left p-6 rounded-2xl border-2 transition-all hover:scale-105 shadow-lg disabled:opacity-60 ${pathColors[path.id] || "border-gray-700"} ${wizardLoading && selectedPath?.id === path.id ? "scale-105" : ""} ${pathGlow[path.id] || ""}`}
                      >
                        <Icon size={32} className="mb-4 text-white" />
                        <h4 className="text-xl font-bold text-white mb-2">{path.name}</h4>
                        <p className="text-gray-400 text-sm mb-4">{path.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                          <Trophy size={14} /> {path.duration}
                        </div>
                        <div className="space-y-1">
                          {path.modules.slice(0, 4).map((m, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" /> {m}
                            </div>
                          ))}
                          {path.modules.length > 4 && <div className="text-xs text-gray-600">+{path.modules.length - 4} more modules</div>}
                        </div>
                        {wizardLoading && selectedPath?.id === path.id && (
                          <div className="flex items-center gap-2 mt-4 text-blue-400 text-sm"><Loader2 className="animate-spin" size={16} /> Building your graph...</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {wizardStep === "preview" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{previewTitle}</h3>
                    <p className="text-sm text-gray-500">Your AI-generated adaptive skill tree — drag to explore, then launch.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setWizardStep("paths"); setSelectedPath(null); }} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition">
                      ← Change Path
                    </button>
                    <button onClick={handleSaveRoadmap} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-blue-900/40">
                      <Trophy size={16} /> Launch Mission
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-[400px]">
                  <Flowchart nodes={previewNodes} edges={previewEdges} />
                </div>
              </div>
            )}

            {/* Saving */}
            {wizardStep === "saving" && (
              <div className="flex-1 flex flex-col items-center justify-center p-16">
                <Loader2 className="animate-spin text-blue-500 mb-6" size={56} />
                <h3 className="text-2xl font-bold text-white mb-2">Launching your mission...</h3>
                <p className="text-gray-500">Saving your adaptive roadmap to the cloud.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
