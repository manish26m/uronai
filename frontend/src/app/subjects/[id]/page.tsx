"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2, Lock, CheckCircle, ShieldAlert, PlayCircle, Trophy, Sparkles, ChevronLeft, Send, ArrowRight } from "lucide-react";
import Flowchart from "@/components/Flowchart";
import { Node, Edge } from "@xyflow/react";

interface RoadmapNode {
  id: string; title: string; type: string;
  status: string; score?: number; position?: { x: number; y: number }; transcript?: string; video_id?: string;
}
interface Subject {
  id: string; title: string; description?: string;
  progress_percentage: number; xp: number; level: number;
  nodes: RoadmapNode[]; edges: any[];
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
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNode, setActiveNode] = useState<RoadmapNode | null>(null);

  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [transcript, setTranscript] = useState<string>("");

  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
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
      if (res.ok) { const d: Subject = await res.json(); setSubject(d); buildGraph(d); }
    } finally { setLoading(false); }
  };

  const buildGraph = (data: Subject) => {
    setNodes((data.nodes || []).map((n, i) => ({
      id: n.id, type: "custom",
      position: n.position || { x: 300 + (i % 2) * 180, y: i * 160 },
      data: { label: n.title, status: n.status, isRoot: i === 0 }
    })));
    setEdges(data.edges || []);
  };

  const handleNodeClick = async (_e: React.MouseEvent, node: Node) => {
    if (!subject) return;
    const back = subject.nodes.find(n => n.id === node.id);
    if (!back) return;
    setActiveNode(back); setQuiz(null); setQuizResult(null); setAnswers({}); setChatHistory([]);
    setTranscript(back.transcript || "");
    if (back.status !== "locked") {
      if (back.video_id) setVideoId(back.video_id);
      else fetchVideoAndTranscript(back.title, back.transcript);
    }
  };

  const fetchVideoAndTranscript = async (topic: string, existingTranscript?: string) => {
    setVideoLoading(true); setVideoId(null);
    try {
      const res = await fetch(`${apiUrl}/youtube/search?q=${encodeURIComponent(topic + " tutorial")}`);
      if (res.ok) {
        const d = await res.json();
        setVideoId(d.video_id);
        // If no stored transcript, fetch from YouTube
        if (!existingTranscript && d.video_id) {
          const tRes = await fetch(`${apiUrl}/youtube/transcript?video_id=${d.video_id}`);
          if (tRes.ok) { const td = await tRes.json(); if (td.transcript) setTranscript(td.transcript.substring(0, 3000)); }
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
    quiz.forEach(q => { if (answers[q.id] === q.answer) correct++; });
    const score = Math.round((correct / quiz.length) * 100);
    setQuizResult({ score, correct, total: quiz.length });
    try {
      const res = await fetch(`${apiUrl}/subjects/evaluate-node/${subject.id}/${activeNode.id}?score=${score}`, { method: "POST", headers: auth() });
      if (res.ok) { const updated: Subject = await res.json(); setSubject(updated); buildGraph(updated); setActiveNode(updated.nodes.find(n => n.id === activeNode.id) || activeNode); }
    } finally { setEvaluating(false); }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeNode) return;
    const msg = chatInput; setChatInput(""); setChatLoading(true);
    setChatHistory(h => [...h, { role: "user", content: msg }]);
    try {
      const res = await fetch(`${apiUrl}/mentor/chat`, { method: "POST", headers: auth(), body: JSON.stringify({ message: msg, context: activeNode.title }) });
      if (res.ok) { const d = await res.json(); setChatHistory(h => [...h, { role: "assistant", content: d.reply }]); }
    } finally { setChatLoading(false); }
  };

  if (loading || !subject) {
    return <div className="flex flex-col items-center justify-center h-[80vh]">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <p className="text-gray-400">Loading Learning Arena...</p>
    </div>;
  }

  const statusColor = { locked: "text-gray-500 bg-gray-800/50", active: "text-blue-400 bg-blue-500/15", completed: "text-green-400 bg-green-500/15", failed: "text-red-400 bg-red-500/15" };
  const statusIcon = { locked: <Lock size={18} />, active: <PlayCircle size={18} />, completed: <CheckCircle size={18} />, failed: <ShieldAlert size={18} /> };

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

      {/* 3-Zone Arena */}
      <div className="flex-1 grid grid-cols-[260px_1fr_300px] gap-4 overflow-hidden min-h-0">

        {/* LEFT: Skill Tree */}
        <div className="bg-gray-950/80 border border-gray-800/50 rounded-2xl overflow-hidden flex flex-col backdrop-blur-sm">
          <div className="p-3 border-b border-gray-800/50 flex items-center gap-2 shrink-0">
            <Sparkles size={13} className="text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Skill Tree</span>
            <span className="ml-auto text-xs text-gray-600">{subject.nodes.length} nodes</span>
          </div>
          <div className="flex-1 min-h-0"><Flowchart nodes={nodes} edges={edges} onNodeClick={handleNodeClick} /></div>
        </div>

        {/* CENTER: Content */}
        <div className="flex flex-col gap-3 overflow-hidden min-h-0">
          {!activeNode ? (
            <div className="flex-1 bg-gray-950/50 border border-dashed border-gray-800/50 rounded-2xl flex flex-col items-center justify-center text-center p-10">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20"><PlayCircle size={30} /></div>
              <h3 className="text-xl font-bold text-white mb-2">Click a node to begin</h3>
              <p className="text-gray-500 text-sm max-w-xs">Select any active node in the Skill Tree to watch its tutorial and unlock the AI assessment.</p>
            </div>
          ) : (
            <>
              <div className={`shrink-0 flex items-center gap-3 p-4 rounded-xl border ${activeNode.status === 'completed' ? 'border-green-500/20 bg-green-500/5' : activeNode.status === 'failed' ? 'border-red-500/20 bg-red-500/5' : activeNode.status === 'active' ? 'border-blue-500/20 bg-blue-500/5' : 'border-gray-800 bg-gray-900/50'}`}>
                <div className={`p-2 rounded-lg ${statusColor[activeNode.status as keyof typeof statusColor] || statusColor.locked}`}>
                  {statusIcon[activeNode.status as keyof typeof statusIcon]}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{activeNode.status} MODULE</p>
                  <h2 className="text-base font-bold text-white line-clamp-1">{activeNode.title}</h2>
                </div>
                {activeNode.score !== undefined && activeNode.score !== null && (
                  <div className={`text-xl font-black ${activeNode.score >= 60 ? 'text-green-400' : 'text-red-400'}`}>{activeNode.score}%</div>
                )}
              </div>

              {activeNode.status === 'locked' ? (
                <div className="flex-1 bg-gray-950/50 border border-gray-800/50 rounded-2xl flex flex-col items-center justify-center p-10 text-center">
                  <Lock size={40} className="text-gray-700 mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">Locked</h3>
                  <p className="text-gray-500 text-sm">Complete parent modules in the Skill Tree to unlock this one.</p>
                </div>
              ) : (
                <>
                  <div className="shrink-0 bg-black rounded-2xl border border-gray-800/50 overflow-hidden aspect-video relative shadow-2xl">
                    {videoLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                        <Loader2 className="animate-spin mb-2" size={28} /><span className="text-sm">Finding best tutorial...</span>
                      </div>
                    ) : videoId ? (
                      <iframe width="100%" height="100%" className="absolute inset-0 border-0"
                        src={`https://www.youtube.com/embed/${videoId}`} title={activeNode.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-700"><PlayCircle size={40} /></div>
                    )}
                  </div>
                  {transcript && (
                    <div className="shrink-0 bg-blue-950/10 border border-blue-800/20 rounded-xl px-4 py-2 flex items-center gap-2">
                      <Sparkles size={12} className="text-blue-400" />
                      <p className="text-xs text-blue-300">Quiz will be generated from this video&apos;s actual content</p>
                    </div>
                  )}
                  <div className="flex-1 bg-gray-950/80 border border-gray-800/50 rounded-2xl overflow-hidden flex flex-col min-h-0 backdrop-blur-sm">
                    <div className="p-3 border-b border-gray-800/50 shrink-0 flex items-center gap-2">
                      <Sparkles size={13} className="text-purple-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400">AI Tutor</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-sm">
                      {chatHistory.length === 0 && <p className="text-gray-600 italic text-center mt-4 text-xs">Ask anything about <strong className="text-gray-400">{activeNode.title}</strong></p>}
                      {chatHistory.map((m, i) => (
                        <div key={i} className={`p-3 rounded-xl max-w-[90%] leading-relaxed text-sm ${m.role === 'user' ? 'bg-blue-600/15 text-blue-100 self-end border border-blue-500/20' : 'bg-gray-800/80 text-gray-200 self-start border border-gray-700/50'}`}>{m.content}</div>
                      ))}
                      {chatLoading && <div className="self-start bg-gray-800 rounded-xl p-3 border border-gray-700"><Loader2 className="animate-spin text-gray-500" size={14} /></div>}
                    </div>
                    <form onSubmit={handleChat} className="p-3 border-t border-gray-800/50 flex gap-2 bg-black/30 shrink-0">
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={`Ask about "${activeNode.title}"...`}
                        className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 placeholder-gray-600 transition"
                      />
                      <button type="submit" disabled={chatLoading || !chatInput.trim()} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white p-2 rounded-lg transition"><Send size={15} /></button>
                    </form>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* RIGHT: Assessment */}
        <div className="bg-gray-950/80 border border-gray-800/50 rounded-2xl overflow-hidden flex flex-col backdrop-blur-sm">
          <div className="p-4 border-b border-gray-800/50 flex items-center gap-2 shrink-0">
            <Trophy size={13} className="text-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">Assessment</span>
          </div>

          {!activeNode || activeNode.status === 'locked' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <Lock size={28} className="text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">Select an active node to take its evaluation quiz.</p>
            </div>
          ) : activeNode.status === 'completed' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <CheckCircle size={36} className="text-green-500 mb-3" />
              <h3 className="font-bold text-white mb-1">Module Complete!</h3>
              <p className="text-green-400 text-3xl font-black">{activeNode.score}%</p>
              <p className="text-gray-500 text-xs mt-3">Check the Skill Tree — downstream nodes are now unlocked!</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-4 min-h-0">
              {!quiz && !quizResult && (
                <div className="flex flex-col items-center text-center flex-1 justify-center gap-4">
                  {activeNode.status === 'failed' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 w-full">
                      <ShieldAlert className="text-red-400 mx-auto mb-2" size={22} />
                      <p className="text-red-300 font-bold text-sm">Previous: {activeNode.score}%</p>
                      <p className="text-gray-500 text-xs mt-1">Review the video and try again.</p>
                    </div>
                  )}
                  {transcript && <p className="text-xs text-blue-400 bg-blue-950/20 border border-blue-800/30 rounded-lg p-3">Quiz questions are pulled from the actual video content above.</p>}
                  <p className="text-gray-500 text-sm">Watch the video, then take the AI quiz to unlock the next module.</p>
                  <button onClick={handleStartQuiz} disabled={quizLoading}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-yellow-900/20"
                  >
                    {quizLoading ? <Loader2 className="animate-spin" /> : <><Trophy size={18} /> Start Evaluation Quiz</>}
                  </button>
                </div>
              )}

              {quiz && !quizResult && (
                <>
                  <div className="flex justify-between items-center shrink-0">
                    <h4 className="font-bold text-white text-sm">Knowledge Check</h4>
                    <span className="text-xs bg-yellow-500/10 text-yellow-400 font-bold px-2 py-0.5 rounded border border-yellow-500/20">{quiz.length} Qs</span>
                  </div>
                  {quiz.map((q, i) => (
                    <div key={q.id} className="bg-gray-900/80 border border-gray-800/50 rounded-xl p-4">
                      <p className="text-sm text-gray-200 font-medium mb-3"><span className="text-blue-400 font-bold">Q{i + 1}:</span> {q.question}</p>
                      <div className="flex flex-col gap-2">
                        {q.options.map(opt => (
                          <button key={opt} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                            className={`text-left text-xs p-3 rounded-lg border transition-all ${answers[q.id] === opt ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-600'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={handleSubmitQuiz} disabled={evaluating || Object.keys(answers).length < quiz.length}
                    className="shrink-0 w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    {evaluating ? <Loader2 className="animate-spin" /> : <><CheckCircle size={16} /> Submit &amp; Score</>}
                  </button>
                </>
              )}

              {quizResult && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                  <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-black ${quizResult.score >= 60 ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-red-500 text-red-400 bg-red-500/10'}`}>
                    {quizResult.score}%
                  </div>
                  <h3 className="text-xl font-bold text-white">{quizResult.score >= 80 ? "Excellent! 🎉" : quizResult.score >= 60 ? "Passed! ✅" : "Failed 😞"}</h3>
                  <p className="text-gray-400 text-sm">{quizResult.correct}/{quizResult.total} correct</p>
                  {quizResult.score < 60 && <p className="text-gray-500 text-xs px-4">Two remedial nodes added to your skill tree. Complete them first.</p>}
                  {quizResult.score >= 60 && <p className="text-gray-500 text-xs">Next modules are now unlocked in the Skill Tree!</p>}
                  <button onClick={() => { setQuiz(null); setQuizResult(null); setAnswers({}); }}
                    className="w-full border border-gray-700 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition text-sm"
                  >
                    Retake Quiz
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
