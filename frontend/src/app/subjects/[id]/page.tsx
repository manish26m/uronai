"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { Loader2, Lock, CheckCircle, ShieldAlert, PlayCircle, Trophy, Sparkles, ArrowRight, ChevronLeft, Send } from "lucide-react";
import Flowchart from "@/components/Flowchart";
import { Node, Edge } from "@xyflow/react";

interface RoadmapNode {
  id: string;
  title: string;
  type: string;
  status: string;
  score?: number;
  position?: { x: number; y: number };
}

interface Subject {
  id: string;
  title: string;
  description?: string;
  progress_percentage: number;
  xp: number;
  level: number;
  nodes: RoadmapNode[];
  edges: any[];
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export default function LearningArena({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [subject, setSubject] = useState<Subject | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  // Active node
  const [activeNode, setActiveNode] = useState<RoadmapNode | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // Quiz
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; correct: number; total: number } | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  // Chat
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => { fetchSubject(); }, [id]);

  const fetchSubject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/subjects/${id}`);
      if (res.ok) {
        const data: Subject = await res.json();
        setSubject(data);
        buildGraph(data);
      }
    } finally { setLoading(false); }
  };

  const buildGraph = (data: Subject) => {
    const rfNodes: Node[] = (data.nodes || []).map((n, i) => ({
      id: n.id, type: "custom",
      position: n.position || { x: 300 + (i % 2) * 160, y: i * 160 },
      data: { label: n.title, status: n.status, isRoot: i === 0 }
    }));
    setNodes(rfNodes);
    setEdges(data.edges || []);
  };

  const handleNodeClick = async (_e: React.MouseEvent, node: Node) => {
    if (!subject) return;
    const back = subject.nodes.find(n => n.id === node.id);
    if (!back) return;
    setActiveNode(back);
    setQuiz(null);
    setQuizResult(null);
    setAnswers({});
    setChatHistory([]);
    if (back.status !== "locked") fetchVideo(back.title);
  };

  const fetchVideo = async (topic: string) => {
    setVideoLoading(true);
    setVideoId(null);
    try {
      const res = await fetch(`${apiUrl}/youtube/search?q=${encodeURIComponent(topic + " tutorial")}`);
      if (res.ok) { const d = await res.json(); setVideoId(d.video_id); }
    } finally { setVideoLoading(false); }
  };

  const handleStartQuiz = async () => {
    if (!activeNode) return;
    setQuizLoading(true);
    setQuiz(null);
    setQuizResult(null);
    setAnswers({});
    try {
      const res = await fetch(`${apiUrl}/quizzes/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: activeNode.title })
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
      const res = await fetch(`${apiUrl}/subjects/evaluate-node/${subject.id}/${activeNode.id}?score=${score}`, { method: "POST" });
      if (res.ok) {
        const updated: Subject = await res.json();
        setSubject(updated);
        buildGraph(updated);
        const updatedNode = updated.nodes.find(n => n.id === activeNode.id);
        if (updatedNode) setActiveNode(updatedNode);
      }
    } finally { setEvaluating(false); }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeNode) return;
    const msg = chatInput;
    setChatInput("");
    setChatHistory(h => [...h, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch(`${apiUrl}/mentor/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, context: activeNode.title })
      });
      if (res.ok) { const d = await res.json(); setChatHistory(h => [...h, { role: "assistant", content: d.reply }]); }
    } finally { setChatLoading(false); }
  };

  if (loading || !subject) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-gray-400">Loading Learning Arena...</p>
      </div>
    );
  }

  const statusIcon = {
    locked: <Lock size={20} />,
    active: <PlayCircle size={20} />,
    completed: <CheckCircle size={20} />,
    failed: <ShieldAlert size={20} />,
  };
  const statusColor = {
    locked: "text-gray-500 bg-gray-800",
    active: "text-blue-400 bg-blue-500/20",
    completed: "text-green-400 bg-green-500/20",
    failed: "text-red-400 bg-red-500/20",
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-[1600px] mx-auto w-full">

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4 shrink-0 px-1">
        <div className="flex items-center gap-4">
          <Link href="/subjects" className="text-gray-500 hover:text-white transition flex items-center gap-1 text-sm">
            <ChevronLeft size={16} /> Mission Board
          </Link>
          <div className="h-4 w-px bg-gray-800" />
          <h1 className="text-xl font-bold text-white truncate max-w-md">{subject.title}</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold px-3 py-1.5 rounded-lg">Lv {subject.level}</div>
          <div className="bg-gray-900 border border-gray-800 text-white font-bold px-3 py-1.5 rounded-lg">{subject.xp} XP</div>
          <div className="bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" style={{ width: `${subject.progress_percentage}%` }} />
              </div>
              <span className="text-xs font-bold">{subject.progress_percentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Zone Arena */}
      <div className="flex-1 grid grid-cols-[280px_1fr_320px] gap-4 overflow-hidden min-h-0">

        {/* ZONE 1: Skill Tree (Left) */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-800 flex items-center gap-2">
            <Sparkles size={14} className="text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Skill Tree</span>
          </div>
          <div className="flex-1 min-h-0">
            <Flowchart nodes={nodes} edges={edges} onNodeClick={handleNodeClick} />
          </div>
        </div>

        {/* ZONE 2: Content Area (Center) */}
        <div className="flex flex-col gap-4 overflow-hidden min-h-0">
          {!activeNode ? (
            <div className="flex-1 bg-gray-950 border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-center p-10">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
                <PlayCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Select a node to begin</h3>
              <p className="text-gray-500 text-sm max-w-xs">Click any active node in the Skill Tree on the left to load the tutorial video and unlock the AI assessment.</p>
            </div>
          ) : (
            <>
              {/* Node Header */}
              <div className={`shrink-0 flex items-center gap-3 p-4 rounded-xl border ${
                activeNode.status === 'locked' ? 'border-gray-800 bg-gray-900' :
                activeNode.status === 'completed' ? 'border-green-500/20 bg-green-500/5' :
                activeNode.status === 'failed' ? 'border-red-500/20 bg-red-500/5' :
                'border-blue-500/20 bg-blue-500/5'
              }`}>
                <div className={`p-2 rounded-lg ${statusColor[activeNode.status as keyof typeof statusColor] || statusColor.locked}`}>
                  {statusIcon[activeNode.status as keyof typeof statusIcon]}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{activeNode.status} MODULE</p>
                  <h2 className="text-lg font-bold text-white line-clamp-1">{activeNode.title}</h2>
                </div>
                {activeNode.score !== undefined && activeNode.score !== null && (
                  <div className={`text-2xl font-bold ${activeNode.score >= 60 ? 'text-green-400' : 'text-red-400'}`}>{activeNode.score}%</div>
                )}
              </div>

              {activeNode.status === 'locked' ? (
                <div className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl flex flex-col items-center justify-center p-10 text-center">
                  <Lock size={48} className="text-gray-700 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Prerequisites Required</h3>
                  <p className="text-gray-500 text-sm">Complete the parent nodes in the Skill Tree first to unlock this module.</p>
                </div>
              ) : (
                <>
                  {/* Video Player */}
                  <div className="shrink-0 bg-black rounded-2xl border border-gray-800 overflow-hidden aspect-video relative shadow-2xl">
                    {videoLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                        <Loader2 className="animate-spin mb-2" size={32} />
                        <span className="text-sm">Finding best tutorial...</span>
                      </div>
                    ) : videoId ? (
                      <iframe width="100%" height="100%" className="absolute inset-0 border-0"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={activeNode.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                        <PlayCircle size={48} />
                      </div>
                    )}
                  </div>

                  {/* AI Tutor Chat (Center Bottom) */}
                  <div className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden flex flex-col min-h-0">
                    <div className="p-3 border-b border-gray-800 flex items-center gap-2 shrink-0">
                      <Sparkles size={14} className="text-purple-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400">AI Tutor</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-sm">
                      {chatHistory.length === 0 && (
                        <p className="text-gray-600 italic text-center mt-4">Confused about the video? Ask me anything about <span className="text-gray-400 font-semibold">{activeNode.title}</span></p>
                      )}
                      {chatHistory.map((m, i) => (
                        <div key={i} className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${m.role === 'user' ? 'bg-blue-600/20 text-blue-100 self-end border border-blue-500/30' : 'bg-gray-800 text-gray-200 self-start border border-gray-700'}`}>
                          {m.content}
                        </div>
                      ))}
                      {chatLoading && <div className="self-start bg-gray-800 rounded-xl p-3 border border-gray-700"><Loader2 className="animate-spin text-gray-500" size={16} /></div>}
                    </div>
                    <form onSubmit={handleChat} className="p-3 border-t border-gray-800 flex gap-2 bg-black/50 shrink-0">
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                        placeholder={`Ask about "${activeNode.title}"...`}
                        className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 placeholder-gray-600 transition"
                      />
                      <button type="submit" disabled={chatLoading || !chatInput.trim()}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white p-2.5 rounded-lg transition"
                      >
                        <Send size={16} />
                      </button>
                    </form>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ZONE 3: Assessment Panel (Right) */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-800 flex items-center gap-2 shrink-0">
            <Trophy size={14} className="text-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">Assessment</span>
          </div>

          {!activeNode || activeNode.status === 'locked' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <Lock size={32} className="text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">Select an active node to take its evaluation quiz.</p>
            </div>
          ) : activeNode.status === 'completed' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <CheckCircle size={40} className="text-green-500 mb-3" />
              <h3 className="font-bold text-white mb-1">Module Conquered!</h3>
              <p className="text-green-400 text-2xl font-bold">{activeNode.score}%</p>
              <p className="text-gray-500 text-sm mt-2">You have unlocked downstream modules. Continue in the Skill Tree.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-4 min-h-0">
              {!quiz && !quizResult && (
                <div className="flex flex-col items-center justify-center text-center flex-1 gap-4">
                  {activeNode.status === 'failed' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 w-full">
                      <ShieldAlert className="text-red-400 mx-auto mb-2" size={24} />
                      <p className="text-red-300 font-bold text-sm">Previous attempt: {activeNode.score}%</p>
                      <p className="text-gray-500 text-xs mt-1">Review the video and try again.</p>
                    </div>
                  )}
                  <p className="text-gray-500 text-sm">Watch the tutorial video, then take the AI-generated quiz to unlock the next module.</p>
                  <button onClick={handleStartQuiz} disabled={quizLoading}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-yellow-900/30"
                  >
                    {quizLoading ? <Loader2 className="animate-spin" /> : <><Trophy size={18} /> Start Evaluation Quiz</>}
                  </button>
                </div>
              )}

              {quiz && !quizResult && (
                <>
                  <div className="flex justify-between items-center shrink-0">
                    <h4 className="font-bold text-white">Knowledge Check</h4>
                    <span className="text-xs bg-yellow-500/10 text-yellow-400 font-bold px-2 py-1 rounded border border-yellow-500/20">{quiz.length} Qs</span>
                  </div>
                  {quiz.map((q, i) => (
                    <div key={q.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <p className="text-sm text-gray-200 font-medium mb-3"><span className="text-blue-400 font-bold">Q{i+1}:</span> {q.question}</p>
                      <div className="flex flex-col gap-2">
                        {q.options.map(opt => (
                          <button key={opt} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                            className={`text-left text-sm p-3 rounded-lg border transition-all ${answers[q.id] === opt ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-gray-950 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={handleSubmitQuiz}
                    disabled={evaluating || Object.keys(answers).length < quiz.length}
                    className="shrink-0 w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-green-900/30"
                  >
                    {evaluating ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> Submit &amp; Score</>}
                  </button>
                </>
              )}

              {quizResult && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                  <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-bold ${quizResult.score >= 60 ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-red-500 text-red-400 bg-red-500/10'}`}>
                    {quizResult.score}%
                  </div>
                  <h3 className="text-xl font-bold text-white">{quizResult.score >= 80 ? "Excellent! 🎉" : quizResult.score >= 60 ? "Passed! ✅" : "Failed 😞"}</h3>
                  <p className="text-gray-400 text-sm">{quizResult.correct} / {quizResult.total} correct answers</p>
                  {quizResult.score < 60 && (
                    <p className="text-gray-500 text-xs">Two remedial nodes have been added to your skill tree. Complete them to retry.</p>
                  )}
                  {quizResult.score >= 60 && (
                    <p className="text-gray-500 text-xs">The next nodes in your skill tree are now unlocked!</p>
                  )}
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
