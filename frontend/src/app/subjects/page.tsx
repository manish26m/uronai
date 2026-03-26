"use client";

import { useState, useEffect } from "react";
import { Plus, PlaySquare, Library, ArrowRight, Loader2, Sparkles, Check, Youtube } from "lucide-react";
import Link from "next/link";
import Flowchart from "@/components/Flowchart";
import { Node, Edge } from "@xyflow/react";

interface Subject {
  id: string;
  title: string;
  description: string | null;
  progress_percentage: number;
}

export default function SubjectsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "youtube">("ai");
  
  const [topicInput, setTopicInput] = useState("");
  const [ytTitle, setYtTitle] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States
  const [isGeneratingFlow, setIsGeneratingFlow] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isCreatingYt, setIsCreatingYt] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/subjects/`);
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error("Failed to fetch subjects", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;
    
    setIsGeneratingFlow(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/subjects/generate-flow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicInput })
      });
      
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      } else {
        alert("Failed to generate AI flowchart");
      }
    } catch (err) {
      console.error("Failed", err);
    } finally {
      setIsGeneratingFlow(false);
    }
  };
  
  const handleFinalizeRoadmap = async () => {
    if (nodes.length === 0) return;
    setIsFinalizing(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const subRes = await fetch(`${apiUrl}/subjects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: topicInput,
          description: "AI Generated Learning Roadmap",
          progress_percentage: 0
        })
      });
      
      if (subRes.ok) {
        const subject = await subRes.json();
        for (const node of nodes) {
          const nodeLabel = (node.data?.label as string) || "Learning Module";
          await fetch(`${apiUrl}/subjects/${subject.id}/videos/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: nodeLabel,
              url: `https://youtube.com/results?search_query=${encodeURIComponent(topicInput + " " + nodeLabel)}`, 
              completed: false
            })
          });
        }
        await fetchSubjects();
        setShowAddForm(false);
        setNodes([]);
        setEdges([]);
        setTopicInput("");
      }
    } catch (err) {
      console.error("Failed to commit roadmap", err);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleCreateYt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytTitle.trim() || !ytUrl.trim()) return;
    setIsCreatingYt(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/subjects/import-playlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: ytTitle, playlist_url: ytUrl })
      });
      if (res.ok) {
        await fetchSubjects();
        setYtTitle("");
        setYtUrl("");
        setShowAddForm(false);
      } else {
        alert("Failed to import playlist.");
      }
    } catch (err) {
      alert("Failed to connect to backend.");
    } finally {
      setIsCreatingYt(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Curriculum</h2>
          <p className="text-gray-400 mt-1">Manage active courses and AI learning roadmaps.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-blue-900/40"
        >
          {showAddForm ? "Cancel" : <><Plus size={20} /> Add Subject</>}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-900 border border-gray-800 p-6 xl:p-8 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl flex flex-col gap-6">
          
          <div className="flex gap-4 border-b border-gray-800 pb-4">
            <button 
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'ai' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}
            >
              <Sparkles size={18} /> AI Architect
            </button>
            <button 
              onClick={() => setActiveTab("youtube")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'youtube' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-white'}`}
            >
              <Youtube size={18} /> YouTube Importer
            </button>
          </div>

          {activeTab === "ai" ? (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Interactive Roadmap Builder</h3>
                  <p className="text-sm text-gray-400">Enter a concept and our AI agent will map an interactive curriculum flowchart.</p>
                </div>
              </div>
              
              <form onSubmit={handleGenerateFlow} className="flex gap-4">
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Master Next.js or Paste a Topic..." 
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  disabled={isGeneratingFlow || isFinalizing}
                />
                <button 
                  type="submit" 
                  disabled={isGeneratingFlow || isFinalizing} 
                  className="bg-white text-black hover:bg-gray-200 disabled:opacity-50 px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center min-w-[180px]"
                >
                  {isGeneratingFlow ? <Loader2 className="animate-spin" size={20} /> : "Generate Flow"}
                </button>
              </form>
              
              {nodes.length > 0 && typeof window !== 'undefined' && (
                <div className="mt-4 animate-in fade-in zoom-in-95 duration-700 flex flex-col gap-4">
                    <div className="h-[500px] w-full border-2 border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                      <Flowchart nodes={nodes} edges={edges} setNodes={setNodes} setEdges={setEdges} />
                    </div>
                    
                    <div className="flex justify-between items-center bg-gray-950 p-4 rounded-xl border border-gray-800">
                      <p className="text-sm text-gray-400">
                        <span className="text-white font-bold">{nodes.length}</span> Modules generated. You can drag and reposition them anywhere.
                      </p>
                      <button 
                        onClick={handleFinalizeRoadmap}
                        disabled={isFinalizing}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-900/40"
                      >
                        {isFinalizing ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                        Finalize & Save Curriculum
                      </button>
                    </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-500/20 p-3 rounded-xl text-red-500">
                  <Youtube size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Extract Playlist</h3>
                  <p className="text-sm text-gray-400">Paste any public YouTube playlist URL and we'll automatically extract all modular videos.</p>
                </div>
              </div>
              <form onSubmit={handleCreateYt} className="flex flex-col gap-4">
                <input 
                  type="text" 
                  required
                  placeholder="Subject Title (e.g. Calculus Course)" 
                  className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  value={ytTitle}
                  onChange={(e) => setYtTitle(e.target.value)}
                  disabled={isCreatingYt}
                />
                <input 
                  type="url" 
                  required
                  placeholder="Playlist URL (e.g. https://youtube.com/playlist?list=...)" 
                  className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  disabled={isCreatingYt}
                />
                <button 
                  type="submit" 
                  disabled={isCreatingYt} 
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {isCreatingYt ? <Loader2 className="animate-spin" size={20} /> : <><Library size={20} /> Scan & Import Content</>}
                </button>
              </form>
            </div>
          )}

        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : subjects.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-400">
          <Library className="mx-auto mb-4 text-gray-700" size={48} />
          <p className="text-lg font-medium text-white mb-2">Your curriculum is empty</p>
          <p>Click "Add Subject" to structurally map out your first goal!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <div key={subject.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-blue-900/10 group flex flex-col justify-between">
              <div className="p-6">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-5 border border-blue-500/20">
                  <Library size={24} />
                </div>
                <h3 className="font-bold text-xl mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">{subject.title}</h3>
                
                <div className="space-y-2 mt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="font-bold text-white tracking-widest">{subject.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${subject.progress_percentage}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-950/50 border-t border-gray-800">
                <Link href={`/subjects/${subject.id}`} className="flex items-center justify-between text-sm font-medium hover:text-blue-400 transition-colors">
                  Open Learning Environment
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
