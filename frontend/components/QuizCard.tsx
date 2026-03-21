"use client";

import { useState } from "react";
import { evaluateAnswer, type EvaluateResult } from "@/lib/api";

interface QuizCardProps {
  question: string;
}

export default function QuizCard({ question }: QuizCardProps) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluateResult | null>(null);

  const handleSubmit = async () => {
    if (!answer.trim() || loading) return;
    setLoading(true);
    
    try {
      const data = await evaluateAnswer({ question, answer });
      setResult(data);
    } catch (err) {
      console.error(err);
      // Fallback
      setResult({ score: 0, correct: false, feedback: "Sorry, I couldn't evaluate that right now." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-2xl mt-4 bg-zinc-50 dark:bg-zinc-900/50 backdrop-blur-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🧠</span>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm tracking-tight">
          Quick Check
        </h3>
      </div>

      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
        {question}
      </p>

      {!result ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={loading}
            placeholder="Type your answer here..."
            rows={2}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 transition-all resize-none disabled:opacity-60"
          />

          <button
            onClick={handleSubmit}
            disabled={!answer.trim() || loading}
            className="w-full h-10 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-30 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
                Checking...
              </>
            ) : (
              "Submit Answer"
            )}
          </button>
        </div>
      ) : (
        <div className={`mt-4 p-4 border rounded-xl animate-in zoom-in-95 duration-300 ${
            result.correct 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30' 
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span>{result.correct ? '✅' : '💡'}</span>
              <span className={`font-semibold text-sm ${
                result.correct ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'
              }`}>
                {result.score}/10
              </span>
            </div>

            {/* Streak badge — shown whenever the backend returns a streak */}
            {result.streak != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold tracking-wide animate-in fade-in duration-500">
                🔥 {result.streak} day streak
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {result.feedback}
          </p>
        </div>
      )}
    </div>
  );
}
