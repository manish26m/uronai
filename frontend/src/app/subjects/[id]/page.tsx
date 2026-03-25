"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, PlayCircle, Trophy, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { use } from "react";

// Types
interface Video {
  id: string;
  title: string;
  url: string;
  completed: boolean;
  subject_id: string;
}

interface Subject {
  id: string;
  title: string;
  description: string;
  progress_percentage: number;
}

// Minimal YouTube ID extractor
const extractYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : "kqtD5dpn9C8"; // Fallback to a valid video
};

export default function SubjectDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjectData();
  }, [resolvedParams.id]);

  const fetchSubjectData = async () => {
    setLoading(true);
    try {
      const subRes = await fetch(`http://127.0.0.1:8000/subjects/${resolvedParams.id}`);
      const vidRes = await fetch(`http://127.0.0.1:8000/subjects/${resolvedParams.id}/videos/`);
      
      if (subRes.ok && vidRes.ok) {
        const subData = await subRes.json();
        const vidData = await vidRes.json();
        
        setSubject(subData);
        setVideos(vidData);
        if (vidData.length > 0) {
          setActiveVideo(vidData.find((v: Video) => !v.completed) || vidData[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch subject data", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (videoId: string, currentCompleted: boolean) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/videos/${videoId}/complete?completed=${!currentCompleted}`, {
        method: "PUT"
      });
      if (res.ok) {
        // Optimistic UI update
        setVideos(current => current.map(v => v.id === videoId ? { ...v, completed: !currentCompleted } : v));
        // Refetch subject to get updated true progress percentage
        fetchSubjectOnly();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubjectOnly = async () => {
    try {
      const subRes = await fetch(`http://127.0.0.1:8000/subjects/${resolvedParams.id}`);
      if (subRes.ok) setSubject(await subRes.json());
    } catch (err) {}
  };

  if (loading || !subject) {
    return (
      <div className="flex flex-col items-center justify-center p-32">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-gray-400">Loading Subject Data from DB...</p>
      </div>
    );
  }

  const completedCount = videos.filter(v => v.completed).length;

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between pb-6 border-b border-gray-800">
        <div>
          <Link href="/subjects" className="text-blue-500 hover:underline text-sm mb-2 inline-block">← Back to Subjects</Link>
          <h1 className="text-3xl font-bold tracking-tight">{subject.title}</h1>
          <p className="text-gray-400 mt-2">{subject.description}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-center min-w-[120px]">
            <p className="text-sm text-gray-500 mb-1">Progress</p>
            <p className="text-2xl font-bold text-blue-500">{subject.progress_percentage}%</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-center min-w-[120px]">
            <p className="text-sm text-gray-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-500">{completedCount}/{videos.length}</p>
          </div>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center text-gray-400">
          <p>No videos found for this subject.</p>
        </div>
      ) : activeVideo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Main Video Player Area */}
            <div className="bg-black rounded-xl overflow-hidden aspect-video border border-gray-800 relative shadow-xl shadow-blue-900/5">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${extractYoutubeId(activeVideo.url)}?autoplay=0`} 
                title={activeVideo.title} 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="absolute inset-0 border-0"
              ></iframe>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{activeVideo.title}</h2>
                <div className="flex items-center gap-4 text-gray-400 text-sm mt-2">
                  <span className="flex items-center gap-1"><Clock size={16} /> 10:00</span>
                  <span className="flex items-center gap-1"><Trophy size={16} /> +10 XP</span>
                </div>
              </div>
              
              <button 
                onClick={() => toggleComplete(activeVideo.id, activeVideo.completed)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeVideo.completed 
                  ? 'bg-green-600/20 text-green-500 border border-green-600/50 hover:bg-green-600/30' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {activeVideo.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                {activeVideo.completed ? 'Completed' : 'Mark as Complete'}
              </button>
            </div>
          </div>

          {/* Playlist Checklist */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-800 bg-gray-950/50 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Course Checklist</h3>
              <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full">{videos.length} videos</span>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {videos.map((video, idx) => (
                <button 
                  key={video.id}
                  onClick={() => setActiveVideo(video)}
                  className={`w-full text-left p-3 rounded-lg flex gap-3 transition-colors ${
                    activeVideo.id === video.id ? 'bg-blue-600/10 border border-blue-600/30' : 'hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  <div className="pt-1">
                    {video.completed ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <PlayCircle className={activeVideo.id === video.id ? 'text-blue-500' : 'text-gray-500'} size={20} />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${activeVideo.id === video.id ? 'text-blue-400' : 'text-gray-200'}`}>
                      {idx + 1}. {video.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
