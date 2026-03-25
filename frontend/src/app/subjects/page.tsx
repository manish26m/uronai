"use client";

import { useState, useEffect } from "react";
import { Plus, PlaySquare, Library, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Subject {
  id: string;
  title: string;
  description: string | null;
  progress_percentage: number;
}

export default function SubjectsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/subjects/");
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

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const res = await fetch("http://127.0.0.1:8000/subjects/import-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: subjectName,
          playlist_url: playlistUrl
        })
      });
      
      if (res.ok) {
        await fetchSubjects();
        setShowAddForm(false);
        setPlaylistUrl("");
        setSubjectName("");
      } else {
        const errData = await res.json();
        alert(`Error importing playlist: ${errData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Failed to create subject", err);
      alert("Failed to connect to the backend.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Learning Subjects</h2>
          <p className="text-gray-400 mt-1">Manage your active courses and learning playlists.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          {showAddForm ? "Cancel" : "Add Subject"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-xl font-semibold mb-4">Add a new Subject via YouTube Playlist</h3>
          <form onSubmit={handleAddSubject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Subject Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Advanced React Patterns" 
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">YouTube Playlist URL</label>
              <div className="relative">
                <PlaySquare className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  type="url" 
                  required
                  placeholder="https://youtube.com/playlist?list=..." 
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">The system will store this in your local SQLite database.</p>
            </div>
            
            <button type="submit" disabled={creating} className="bg-white text-black hover:bg-gray-200 disabled:opacity-50 px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center min-w-[150px]">
              {creating ? <Loader2 className="animate-spin" size={20} /> : "Extract & Create"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : subjects.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-400">
          <Library className="mx-auto mb-4 text-gray-700" size={48} />
          <p className="text-lg font-medium text-white mb-2">No subjects found</p>
          <p>Click "Add Subject" to create your first learning topic!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <div key={subject.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-blue-900/10 group flex flex-col justify-between">
              <div className="p-6">
                <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <Library size={24} />
                </div>
                <h3 className="font-semibold text-xl mb-2 group-hover:text-blue-400 transition-colors">{subject.title}</h3>
                
                <div className="space-y-2 mt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="font-medium text-white">{subject.progress_percentage}%</span>
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
                  View Subject Dashboard
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
