"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sparkles, CheckCircle2, XCircle, BrainCircuit, ArrowRight, Loader2, Trophy } from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface QuizContext {
  questions: Question[];
}

export default function AIQuizPage() {
  const { data: session } = useSession();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizContext | null>(null);
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const token = (session as any)?.backendToken;

  const generateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    
    setLoading(true);
    setQuiz(null);
    setQuizCompleted(false);
    setCurrentQuestionIdx(0);
    setScore(0);
    setShowExplanation(false);
    setSelectedOption(null);

    try {
      const res = await fetch(`${apiUrl}/quizzes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ subject: topic })
      });
      const data = await res.json();
      setQuiz(data);
    } catch (err) {
      console.error(err);
      // Fallback if backend is down
      setQuiz({
        subject: topic,
        questions: [
          {
            id: 1,
            question: `What is the primary benefit of testing in ${topic}?`,
            options: ["It makes the code slower", "It ensures reliability and catches bugs early", "It replaces the need for documentation", "It creates more lines of code"],
            answer: "It ensures reliability and catches bugs early",
            explanation: "Testing is crucial for identifying defects and ensuring software behaves as expected."
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (showExplanation) return;
    setSelectedOption(option);
    setShowExplanation(true);
    
    if (quiz && option === quiz.questions[currentQuestionIdx].answer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (!quiz) return;
    
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx(idx => idx + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-500/20 text-purple-500 p-2 rounded-lg">
              <Sparkles size={28} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">AI Generated Quizzes</h2>
          </div>
          <p className="text-gray-400">Test your knowledge on any topic instantly.</p>
        </div>
        
        <form onSubmit={generateQuiz} className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="e.g. React Hooks, AWS UI..." 
            className="flex-1 md:w-64 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading || !topic}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center min-w-[120px]"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Generate"}
          </button>
        </form>
      </div>

      {!quiz && !loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 flex flex-col items-center justify-center text-center">
          <BrainCircuit className="text-gray-700 mb-4" size={64} />
          <h3 className="text-xl font-bold mb-2">Ready to challenge your brain?</h3>
          <p className="text-gray-400 max-w-md">Enter a topic above and our AI will instantly generate a customized quiz to test your understanding and identify weak points.</p>
        </div>
      )}

      {loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
          <h3 className="text-xl font-bold mb-2">Synthesizing Knowledge...</h3>
          <p className="text-gray-400">Crafting the perfect questions for {topic}</p>
        </div>
      )}

      {quiz && !quizCompleted && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="bg-gray-950/50 p-4 border-b border-gray-800 flex justify-between items-center text-sm font-medium">
            <span className="text-gray-400">Question {currentQuestionIdx + 1} of {quiz.questions.length}</span>
            <span className="text-purple-400">{topic}</span>
          </div>
          
          <div className="p-6 md:p-8 space-y-6">
            <h3 className="text-2xl font-semibold leading-relaxed">
              {quiz.questions[currentQuestionIdx].question}
            </h3>
            
            <div className="grid gap-3">
              {quiz.questions[currentQuestionIdx].options.map((option, idx) => {
                const isSelected = selectedOption === option;
                const isCorrect = option === quiz.questions[currentQuestionIdx].answer;
                
                let buttonStyle = "bg-gray-950 border-gray-800 hover:border-purple-500 hover:bg-purple-500/5 text-gray-200";
                
                if (showExplanation) {
                  if (isCorrect) buttonStyle = "bg-green-500/10 border-green-500 text-green-400";
                  else if (isSelected && !isCorrect) buttonStyle = "bg-red-500/10 border-red-500 text-red-400";
                  else buttonStyle = "bg-gray-950 border-gray-800 opacity-50";
                }
                
                return (
                  <button 
                    key={idx}
                    disabled={showExplanation}
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium flex justify-between items-center ${buttonStyle}`}
                  >
                    <span>{option}</span>
                    {showExplanation && isCorrect && <CheckCircle2 className="text-green-500" />}
                    {showExplanation && isSelected && !isCorrect && <XCircle className="text-red-500" />}
                  </button>
                )
              })}
            </div>
            
            {showExplanation && (
              <div className="mt-6 p-4 rounded-xl bg-blue-900/20 border border-blue-500/30 text-blue-100 animate-in fade-in slide-in-from-bottom-2">
                <p className="font-semibold text-blue-400 mb-1">Explanation</p>
                <p>{quiz.questions[currentQuestionIdx].explanation}</p>
                
                <button 
                  onClick={nextQuestion}
                  className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {currentQuestionIdx < quiz.questions.length - 1 ? "Next Question" : "See Results"} 
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {quizCompleted && quiz && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-purple-500/20 text-purple-500 rounded-full flex items-center justify-center mb-6">
            <Trophy className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
          <p className="text-gray-400 mb-8">Here is how you performed on {topic}</p>
          
          <div className="bg-gray-950 border border-gray-800 p-6 rounded-2xl w-full max-w-sm mb-8">
            <div className="text-6xl font-black text-white mb-2">
              {Math.round((score / quiz.questions.length) * 100)}<span className="text-3xl text-gray-500">%</span>
            </div>
            <p className="text-gray-400 font-medium">{score} out of {quiz.questions.length} correct</p>
          </div>
          
          <button 
            onClick={() => {
              setQuiz(null);
              setTopic("");
              setQuizCompleted(false);
            }}
            className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl font-bold transition-colors"
          >
            Take Another Quiz
          </button>
        </div>
      )}
    </div>
  );
}

