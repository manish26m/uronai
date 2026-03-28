"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2, Lock, CheckCircle2, AlertCircle, PlayCircle, Trophy, Sparkles, ChevronLeft, Send, ToggleLeft, ToggleRight, Video } from "lucide-react";
import RoadmapList from "@/components/RoadmapList";

interface RoadmapNode {
  id: string; title: string; type: string;
  status: string; score?: number; position?: { x: number; y: number };
  transcript?: string; video_id?: string; description?: string;
}
interface Subject {
  id: string; title: string; description?: string;
  progress_percentage: number; xp: number; level: number;
  nodes: RoadmapNode[]; edges: any[]; disable_youtube?: boolean;
}
interface QuizQuestion {
  id: number; question: string; options: string[]; answer: string; explanation?: string;
}

export default function LearningArena({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const token = (session as any)?.backendToken;
  const auth = (extra = {}) => ({ "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra });

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNode, setActiveNode] = useState<RoadmapNode | null>(null);

  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [ytEnabled, setYtEnabled] = useState(true);

  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  // answers[questionId] = index (0-3) of selected option
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; correct: number; total: number } | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => { if (token) fetchSubject(); }, [id, token]);

  const fetchSubject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/subjects/${id}`, { headers: auth() });
      if (res.ok) {
        const d: Subject = await res.json();
        setSubject(d);
        setYtEnabled(!d.disable_youtube);
      }
    } finally { setLoading(false); }
  };

  const handleNodeClick = async (node: RoadmapNode) => {
    if (!subject) return;
    const back = subject.nodes.find(n => n.id === node.id);
    if (!back) return;
    setActiveNode(back);
    setQuiz(null); setQuizResult(null); setAnswers({});
    setChatHistory([]);
    setTranscript(back.transcript || "");
    setVideoId(null);

    if (back.status !== "locked") {
      // If node has a specific video_id (from user-provided YouTube URL), use it directly
      if (back.video_id) {
        setVideoId(back.video_id);
        // Fetch transcript for that specific video if we don't already have one
        if (!back.transcript) {
          fetchTranscriptForVideo(back.video_id);
        }
      } else if (ytEnabled && !subject.disable_youtube) {
        // Only search YouTube if user hasn't disabled it and no specific video was set
        fetchVideoAndTranscript(back.title, back.transcript);
      }
    }
  };

  const fetchTranscriptForVideo = async (vid: string) => {
    try {
      const tRes = await fetch(`${apiUrl}/youtube/transcript?video_id=${vid}`);
      if (tRes.ok) {
        const td = await tRes.json();
        if (td.transcript) setTranscript(td.transcript.substring(0, 3000));
      }
    } catch { /* silent */ }
  };

  const fetchVideoAndTranscript = async (topic: string, existingTranscript?: string) => {
    setVideoLoading(true); setVideoId(null);
    try {
      const res = await fetch(`${apiUrl}/youtube/search?q=${encodeURIComponent(topic + " tutorial")}`);
      if (res.ok) {
        const d = await res.json();
        setVideoId(d.video_id);
        if (!existingTranscript && d.video_id) {
          fetchTranscriptForVideo(d.video_id);
        }
      }
    } finally { setVideoLoading(false); }
  };

  const handleStartQuiz = async () => {
    if (!activeNode) return;
    setQuizLoading(true); setQuiz(null); setQuizResult(null); setAnswers({});
    try {
      const res = await fetch(`${apiUrl}/quizzes/generate`, {
        method: "POST", headers: auth(),
        body: JSON.stringify({ subject: activeNode.title, transcript: transcript || undefined })
      });
      if (res.ok) { const d = await res.json(); setQuiz(d.questions); }
    } finally { setQuizLoading(false); }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !activeNode || !subject) return;
    setEvaluating(true);
    let correct = 0;
    quiz.forEach(q => {
      const selectedIndex = answers[q.id];
      if (selectedIndex === undefined) return;
      const selectedText = q.options[selectedIndex];
      // Resolve AI letter answer ("A","B","C","D") to option text for comparison
      let correctText = q.answer;
      const letter = String(q.answer).trim().toUpperCase();
      if (["A", "B", "C", "D"].includes(letter)) {
        const idx = letter.charCodeAt(0) - 65;
        correctText = q.options[idx] ?? q.answer;
      }
      if (selectedText === correctText) correct++;
    });
    const score = Math.round((correct / quiz.length) * 100);
    setQuizResult({ score, correct, total: quiz.length });
    try {
      const res = await fetch(`${apiUrl}/subjects/evaluate-node/${subject.id}/${activeNode.id}?score=${score}`, { method: "POST", headers: auth() });
      if (res.ok) {
        const updated: Subject = await res.json();
        setSubject(updated);
        setActiveNode(updated.nodes.find(n => n.id === activeNode.id) || activeNode);
      }
    } finally { setEvaluating(false); }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeNode) return;
    const msg = chatInput; setChatInput(""); setChatLoading(true);
    setChatHistory(h => [...h, { role: "user", content: msg }]);
    try {
      const res = await fetch(`${apiUrl}/mentor/chat`, {
        method: "POST", headers: auth(),
        body: JSON.stringify({ message: msg, context: activeNode.title })
      });
      if (res.ok) { const d = await res.json(); setChatHistory(h => [...h, { role: "assistant", content: d.reply }]); }
    } finally { setChatLoading(false); }
  };

  if (loading || !subject) {
    return <div className="flex flex-col items-center justify-center h-[80vh]">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <p className="text-gray-400">Loading Learning Arena...</p>
    </div>;
  }

  const statusColor = {
    locked: "text-gray-500 bg-gray-800/50",
    active: "text-blue-400 bg-blue-500/15",
    completed: "text-green-400 bg-green-500/15",
    failed: "text-red-400 bg-red-500/15"
  };
  const statusIcon = {
    locked: <Lock size={18} />,
    active: <PlayCircle size={18} />,
    completed: <CheckCircle2 size={18} />,
    failed: <AlertCircle size={18} />
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-[1700px] mx-auto w-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4 shrink-0 px-1">
        <div className="flex items-center gap-3">
          <Link href="/subjects" className="text-gray-500 hover:text-white transition flex items-center gap-1 text-sm"><ChevronLeft size={16} /> Missions</Link>
          <div className="h-4 w-px bg-gray-800" />
          <h1 className="text-lg font-bold text-white truncate max-w-sm">{subject.title}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {/* YouTube toggle */}
            <button
              onClick={() => setYtEnabled(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${ytEnabled ? "border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10" : "border-gray-700 bg-gray-900 text-gray-500 hover:text-gray-300"}`}
            >
              <Video size={12} />
              {ytEnabled ? "YT: ON" : "YT: OFF"}
              {ytEnabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            </button>
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold px-3 py-1.5 rounded-lg">Lv {subject.level}</div>
          <div className="bg-gray-900 border border-gray-800 text-white font-bold px-3 py-1.5 rounded-lg">{subject.xp} XP</div>
          <div className="bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" style={{ width: `${subject.progress_percentage}%` }} />
            </div>
            <span className="text-xs font-bold text-gray-400">{subject.progress_percentage}%</span>
          </div>
        </div>
      </div>

      {/* 3-Zone Arena Redesign: Top-Horizontal Roadmap, Center-Video, Right-Sidebar (Chat+Quiz) */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
        
        {/* TOP: Horizontal Roadmap */}
        <div className="shrink-0 pt-2 pb-1">
          <RoadmapList
            variant="horizontal"
            nodes={subject.nodes.map(n => ({ id: n.id, title: n.title, status: n.status, description: n.description }))}
            onNodeClick={(n) => {
              const full = subject.nodes.find(x => x.id === n.id);
              if (full) handleNodeClick(full);
            }}
            activeNodeId={activeNode?.id}
          />
        </div>

        <div className="flex-1 grid grid-cols-[1fr_350px] gap-4 min-h-0 overflow-hidden">
          
          {/* LEFT/CENTER: Content (Video + Description) */}
          <div className="flex flex-col gap-3 overflow-hidden min-h-0">
            {!activeNode ? (
              <div className="flex-1 bg-gray-950/50 border border-dashed border-gray-800/50 rounded-2xl flex flex-col items-center justify-center text-center p-10">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20"><PlayCircle size={30} /></div>
                <h3 className="text-xl font-bold text-white mb-2">Click a module to begin</h3>
                <p className="text-gray-500 text-sm max-w-xs">Select any unlocked module from the timetable above to watch the tutorial and start learning.</p>
              </div>
            ) : (
              <>
                <div className={`shrink-0 flex items-center gap-3 p-3 rounded-xl border ${activeNode.status === 'completed' ? 'border-green-500/20 bg-green-500/5' : activeNode.status === 'failed' ? 'border-red-500/20 bg-red-500/5' : activeNode.status === 'active' ? 'border-blue-500/20 bg-blue-500/5' : 'border-gray-800 bg-gray-900/50'}`}>
                  <div className={`p-2 rounded-lg ${statusColor[activeNode.status as keyof typeof statusColor] || statusColor.locked}`}>
                    {statusIcon[activeNode.status as keyof typeof statusIcon]}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{activeNode.status} MODULE</p>
                    <h2 className="text-sm font-bold text-white line-clamp-1">{activeNode.title}</h2>
                  </div>
                  {activeNode.score !== undefined && activeNode.score !== null && (
                    <div className={`text-lg font-black ${activeNode.score >= 60 ? 'text-green-400' : 'text-red-400'}`}>{activeNode.score}%</div>
                  )}
                </div>

                {activeNode.status === 'locked' ? (
                  <div className="flex-1 bg-gray-950/50 border border-gray-800/50 rounded-2xl flex flex-col items-center justify-center p-10 text-center">
                    <Lock size={40} className="text-gray-700 mb-3" />
                    <h3 className="text-lg font-bold text-white mb-2">Locked</h3>
                    <p className="text-gray-500 text-sm">Complete previous modules to unlock this one.</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-3 min-h-0">
                    <div className="shrink-0 bg-black rounded-2xl border border-gray-800/50 overflow-hidden shadow-2xl w-full" style={{ paddingBottom: '56.25%', position: 'relative' }}>
                      {videoLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                          <Loader2 className="animate-spin mb-2" size={28} /><span className="text-sm">Finding best tutorial...</span>
                        </div>
                      ) : videoId ? (
                        <iframe
                          className="absolute inset-0 w-full h-full border-0"
                          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                          title={activeNode.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 gap-2">
                          <PlayCircle size={40} />
                          <p className="text-xs text-gray-600">
                            {!ytEnabled ? "YouTube recommendations are OFF" : "Click a module to load its video"}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {activeNode.description && (
                      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 overflow-y-auto">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Module Description</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">{activeNode.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT: Sidebar (Chat + Assessment) */}
          <div className="flex flex-col gap-4 overflow-hidden min-h-0">
            {/* AI Tutor Chat */}
            <div className={`flex-[1.2] flex flex-col bg-gray-950/80 border border-gray-800/50 rounded-2xl overflow-hidden backdrop-blur-sm ${!activeNode || activeNode.status === 'locked' ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
              <div className="p-3 border-b border-gray-800/50 shrink-0 flex items-center gap-2">
                <Sparkles size={13} className="text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">AI Tutor</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-xs scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-800">
                {chatHistory.length === 0 && activeNode && <p className="text-gray-600 italic text-center mt-4">Ask anything about <strong className="text-gray-400">{activeNode.title}</strong></p>}
                {chatHistory.map((m, i) => (
                  <div key={i} className={`p-2.5 rounded-xl max-w-[90%] leading-relaxed ${m.role === 'user' ? 'bg-blue-600/15 text-blue-100 self-end border border-blue-500/20' : 'bg-gray-800/80 text-gray-200 self-start border border-gray-700/50'}`}>{m.content}</div>
                ))}
                {chatLoading && <div className="self-start bg-gray-800 rounded-xl p-2 border border-gray-700"><Loader2 className="animate-spin text-gray-500" size={12} /></div>}
              </div>
              <form onSubmit={handleChat} className="p-2 border-t border-gray-800/50 flex gap-2 bg-black/30 shrink-0">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask a question..."
                  className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 placeholder-gray-600"
                />
                <button type="submit" disabled={chatLoading || !chatInput.trim()} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white p-1.5 rounded-lg transition"><Send size={14} /></button>
              </form>
            </div>

            {/* Assessment Quiz */}
            <div className={`flex-1 flex flex-col bg-gray-950/80 border border-gray-800/50 rounded-2xl overflow-hidden backdrop-blur-sm ${!activeNode || activeNode.status === 'locked' ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
              <div className="p-3 border-b border-gray-800/50 flex items-center gap-2 shrink-0">
                <Trophy size={13} className="text-yellow-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">Assessment</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-800">
                {activeNode?.status === 'completed' ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <CheckCircle2 size={30} className="text-green-500 mb-2" />
                    <h3 className="text-sm font-bold text-white mb-1">Passed!</h3>
                    <p className="text-green-400 text-2xl font-black">{activeNode.score}%</p>
                  </div>
                ) : !quiz && !quizResult ? (
                  <div className="flex flex-col items-center text-center flex-1 justify-center gap-3">
                    <Trophy size={30} className="text-gray-700 mb-1" />
                    <p className="text-gray-500 text-xs">Ready for the eval?</p>
                    <button onClick={handleStartQuiz} disabled={quizLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl transition flex items-center justify-center gap-2 text-xs">
                      {quizLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} Start Quiz
                    </button>
                  </div>
                ) : quiz && !quizResult ? (
                  <div className="space-y-4">
                    {quiz.map((q, qIdx) => (
                      <div key={q.id} className="space-y-2">
                        <p className="text-xs font-semibold text-gray-300">Q{qIdx + 1}: {q.question}</p>
                        <div className="grid gap-1.5">
                          {q.options.map((opt, oIdx) => (
                            <button key={oIdx} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                              className={`text-left p-2 rounded-lg text-[10px] border transition-all ${answers[q.id] === oIdx ? 'bg-blue-600/20 border-blue-500 text-blue-100' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button onClick={handleSubmitQuiz} disabled={evaluating || Object.keys(answers).length < quiz.length}
                      className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold py-2 rounded-xl transition mt-4 text-xs"
                    >
                      {evaluating ? <Loader2 className="animate-spin" size={14} /> : "Submit Answers"}
                    </button>
                  </div>
                ) : quizResult && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                    <div className={`p-3 rounded-full ${quizResult.score >= 60 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {quizResult.score >= 60 ? <Trophy size={32} /> : <AlertCircle size={32} />}
                    </div>
                    <h3 className="text-lg font-black text-white">{quizResult.score}%</h3>
                    <p className="text-xs text-gray-500">{quizResult.correct} / {quizResult.total} correct</p>
                    <button onClick={() => { setQuiz(null); setQuizResult(null); setAnswers({}); }} className="mt-2 text-xs text-blue-400 hover:underline">Try again</button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
