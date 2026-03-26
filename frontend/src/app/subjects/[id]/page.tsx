"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, PlayCircle, Trophy, Clock, Loader2, Lock, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import Flowchart from "@/components/Flowchart";
import { Node, Edge } from "@xyflow/react";

interface RoadmapNode {
  id: string;
  type: string;
  title: string;
  status: string;
  score?: number;
  url?: string;
  position?: { x: number, y: number };
}

interface Subject {
  id: string;
  title: string;
  description: string;
  progress_percentage: number;
  xp: number;
  level: number;
  nodes: RoadmapNode[];
  edges: Edge[];
}

export default function SubjectDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [subject, setSubject] = useState<Subject | null>(null);
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  const [activeNode, setActiveNode] = useState<RoadmapNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  
  const [activeQuiz, setActiveQuiz] = useState<any[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchSubjectData();
  }, [resolvedParams.id]);

  const fetchSubjectData = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const subRes = await fetch(`${apiUrl}/subjects/${resolvedParams.id}`);
      
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubject(subData);
        
        // Transform backend nodes to ReactFlow nodes
        const rfNodes = (subData.nodes || []).map((n: RoadmapNode, index: number) => ({
          id: n.id,
          type: "custom",
          position: n.position || { x: 350 + (index % 2 * 100), y: index * 150 },
          data: { label: n.title, status: n.status, isRoot: index === 0 }
        }));
        
        setNodes(rfNodes);
        setEdges(subData.edges || []);
      }
    } catch (err) {
      console.error("Failed to fetch subject data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!activeNode) return;
    setQuizLoading(true);
    setActiveQuiz(null);
    setSelectedAnswers({});
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/quizzes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: activeNode.title })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveQuiz(data.questions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizSubmit = async () => {
    if (!activeQuiz) return;
    let correct = 0;
    activeQuiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.answer) correct++;
    });
    const score = Math.round((correct / activeQuiz.length) * 100);
    await handleEvaluateNode(score);
    setActiveQuiz(null);
  };

  const fetchTopicVideo = async (topic: string) => {
    setActiveVideoId(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/youtube/search?q=${encodeURIComponent(topic + " course tutorial")}`);
      if(res.ok) {
         const data = await res.json();
         setActiveVideoId(data.video_id);
      }
    } catch(err) {}
  };

  const handleNodeClick = (e: React.MouseEvent, node: Node) => {
    if (!subject) return;
    const backendNode = subject.nodes.find(n => n.id === node.id);
    if (backendNode) {
      setActiveNode(backendNode);
      setActiveQuiz(null);
      setChatHistory([]);
      fetchTopicVideo(backendNode.title);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!chatMessage.trim() || !activeNode) return;
     
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, {role: "user", content: userMsg}]);
    setChatMessage("");
    setChatLoading(true);
     
    try {
       const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
       const res = await fetch(`${apiUrl}/mentor/chat`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMsg, context: activeNode.title })
       });
       if(res.ok) {
          const data = await res.json();
          setChatHistory(prev => [...prev, {role: "assistant", content: data.reply}]);
       }
    } catch(err) {
    } finally {
       setChatLoading(false);
    }
  };

  const handleEvaluateNode = async (simulatedScore: number) => {
    if (!activeNode || !subject) return;
    setEvaluating(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/subjects/evaluate-node/${subject.id}/${activeNode.id}?score=${simulatedScore}`, {
        method: "POST"
      });
      if (res.ok) {
        const updatedSubject = await res.json();
        setSubject(updatedSubject);
        
        // Update ReactFlow graph visibly
        const rfNodes = (updatedSubject.nodes || []).map((n: RoadmapNode, index: number) => ({
          id: n.id,
          type: "custom",
          position: n.position || { x: 350 + (index % 2 * 100), y: index * 150 },
          data: { label: n.title, status: n.status, isRoot: index === 0 }
        }));
        setNodes(rfNodes);
        
        // Update active node panel state
        setActiveNode(updatedSubject.nodes.find((n: RoadmapNode) => n.id === activeNode.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading || !subject) {
    return (
      <div className="flex flex-col items-center justify-center p-32">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-gray-400">Syncing Adaptive Graph data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col h-[calc(100vh-100px)]">
      <div className="mb-6 flex items-center justify-between pb-6 border-b border-gray-800 shrink-0">
        <div>
          <Link href="/subjects" className="text-blue-500 hover:underline text-sm mb-2 inline-block">← Back to Curriculum</Link>
          <h1 className="text-3xl font-bold tracking-tight">{subject.title}</h1>
          <p className="text-gray-400 mt-2">{subject.description}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-gradient-to-br from-gray-900 to-blue-950/20 border border-blue-900/50 p-4 rounded-xl text-center min-w-[120px] shadow-lg shadow-blue-900/20">
            <p className="text-sm text-blue-400 font-bold mb-1 uppercase tracking-widest">Level</p>
            <p className="text-3xl font-bold text-white">{subject.level}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-green-950/20 border border-green-900/50 p-4 rounded-xl text-center min-w-[120px] shadow-lg shadow-green-900/10">
            <p className="text-sm text-green-400 font-bold mb-1 uppercase tracking-widest">XP Points</p>
            <p className="text-3xl font-bold text-white">{subject.xp}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-center min-w-[120px]">
            <p className="text-sm text-gray-500 mb-1 uppercase tracking-widest font-bold">Progress</p>
            <p className="text-3xl font-bold text-blue-500">{subject.progress_percentage}%</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Interactive Graph Area */}
        <div className="lg:col-span-2 h-full border-2 border-gray-800 rounded-2xl overflow-hidden shadow-2xl relative bg-black">
           <Flowchart nodes={nodes} edges={edges} onNodeClick={handleNodeClick} />
        </div>

        {/* Action Panel */}
        <div className="h-full">
          {!activeNode ? (
            <div className="h-full border border-gray-800 border-dashed rounded-2xl flex flex-col items-center justify-center p-10 text-center text-gray-500 bg-gray-900/50">
               <Sparkles size={48} className="mb-4 text-gray-700" />
               <h3 className="text-xl font-bold text-gray-400 mb-2">Adaptive Learning Engine</h3>
               <p>Click on any node in the graph to view its content, complete assessments, and unlock downstream skills!</p>
            </div>
          ) : (
            <div className="h-full bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 shadow-2xl">
                
                <div className="flex items-center gap-3 mb-6">
                  {activeNode.status === 'locked' && <div className="p-3 bg-gray-800 text-gray-500 rounded-xl"><Lock size={24} /></div>}
                  {activeNode.status === 'active' && <div className="p-3 bg-blue-500/20 text-blue-500 rounded-xl"><PlayCircle size={24} /></div>}
                  {activeNode.status === 'completed' && <div className="p-3 bg-green-500/20 text-green-500 rounded-xl"><CheckCircle size={24} /></div>}
                  {activeNode.status === 'failed' && <div className="p-3 bg-red-500/20 text-red-500 rounded-xl"><ShieldAlert size={24} /></div>}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{activeNode.status} MODULE</span>
                    <h2 className="text-2xl font-bold mt-1 line-clamp-2">{activeNode.title}</h2>
                  </div>
                </div>

                {activeNode.status === 'locked' && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-950 rounded-xl border border-gray-800 mb-6">
                    <Lock className="text-gray-600 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-white mb-2">Prerequisites Unfulfilled</h3>
                    <p className="text-gray-400 text-sm">You must complete the parent modules connected to this node before you can unlock its content.</p>
                  </div>
                )}

                {activeNode.status !== 'locked' && (
                  <div className="flex-1 flex flex-col gap-4">
                    {activeVideoId ? (
                      <div className="bg-black aspect-video rounded-xl border border-gray-800 flex items-center justify-center overflow-hidden relative shadow-lg">
                         <iframe 
                           width="100%" height="100%" 
                           src={`https://www.youtube.com/embed/${activeVideoId}`} 
                           title={activeNode.title} 
                           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                           allowFullScreen
                           className="absolute inset-0 border-0"
                         ></iframe>
                      </div>
                    ) : (
                      <div className="bg-black aspect-video rounded-xl border border-gray-800 flex flex-col items-center justify-center text-gray-600 shadow-lg">
                         <Loader2 className="animate-spin mb-2" size={32} />
                         <span className="text-sm">Locating optimal tutorial...</span>
                      </div>
                    )}
                    
                    {/* Ask AI Mentor */}
                    <div className="bg-gray-950 flex flex-col rounded-xl border border-gray-800 overflow-hidden mb-2 shadow-lg">
                       <div className="p-3 border-b border-gray-800 bg-gray-900/50 flex gap-2 items-center text-purple-400">
                          <Sparkles size={16} /> <span className="text-xs font-bold uppercase tracking-wider">AI Tutor Chat</span>
                       </div>
                       <div className="p-3 max-h-48 overflow-y-auto flex flex-col gap-3 text-sm">
                          {chatHistory.length === 0 ? (
                             <p className="text-gray-500 italic text-center py-2">Ask a question if you don't understand the video.</p>
                          ) : (
                             chatHistory.map((msg, i) => (
                                <div key={i} className={`p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-900/20 text-blue-100 self-end border border-blue-800/30' : 'bg-gray-800 text-gray-200 self-start border border-gray-700 max-w-[90%]'}`}>
                                   {msg.content}
                                </div>
                             ))
                          )}
                          {chatLoading && <div className="p-2 self-start"><Loader2 className="animate-spin text-gray-500" size={16} /></div>}
                       </div>
                       <form onSubmit={handleChatSubmit} className="p-2 border-t border-gray-900 flex gap-2 bg-black">
                          <input 
                            value={chatMessage} onChange={e => setChatMessage(e.target.value)}
                            placeholder="Need clarification?" 
                            className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" 
                          />
                          <button type="submit" disabled={chatLoading} className="bg-blue-600 text-white p-2 px-3 rounded-lg hover:bg-blue-500 disabled:opacity-50">
                             <ArrowRight size={16} />
                          </button>
                       </form>
                    </div>
                    
                    {activeNode.score !== null && activeNode.score !== undefined && (
                      <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                        <span className="text-gray-400 font-bold text-sm">Previous Score</span>
                        <span className={`font-bold text-xl ${activeNode.score >= 80 ? 'text-green-500' : 'text-red-500'}`}>{activeNode.score}%</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-6 border-t border-gray-800 mt-auto flex flex-col gap-3">
                  {(activeNode.status === 'active' || activeNode.status === 'failed') && !activeQuiz && (
                     <button 
                       disabled={quizLoading}
                       onClick={handleGenerateQuiz} 
                       className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/40"
                     >
                       {quizLoading ? <Loader2 className="animate-spin" /> : <><Trophy size={20} /> Start True Evaluation Quiz</>}
                     </button>
                  )}
                  
                  {activeQuiz && (
                    <div className="flex flex-col gap-6 bg-gray-950 p-4 rounded-xl border border-gray-800 animate-in fade-in zoom-in-95 duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-white">Knowledge Assessment</h4>
                        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">{activeQuiz.length} Questions</span>
                      </div>
                      
                      {activeQuiz.map((q: any, i: number) => (
                        <div key={q.id} className="space-y-3 pb-4 border-b border-gray-800 last:border-0 last:pb-0">
                          <p className="text-sm text-gray-200"><span className="font-bold text-blue-400">Q{i+1}:</span> {q.question}</p>
                          <div className="flex flex-col gap-2">
                            {q.options.map((opt: string) => (
                              <button
                                key={opt}
                                onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                className={`text-left p-3 rounded-lg text-sm transition-all border ${selectedAnswers[q.id] === opt ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button 
                        disabled={evaluating || Object.keys(selectedAnswers).length < activeQuiz.length}
                        onClick={handleQuizSubmit} 
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 mt-4 rounded-xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-green-900/40"
                      >
                        {evaluating ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20} /> Submit Answers & Score It</>}
                      </button>
                    </div>
                  )}

                  {activeNode.status === 'completed' && (
                     <button className="w-full bg-green-600/20 border border-green-500/50 text-green-500 font-bold py-4 rounded-xl flex justify-center items-center gap-2">
                        <CheckCircle size={20} /> Module Conquered
                     </button>
                  )}
                </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
