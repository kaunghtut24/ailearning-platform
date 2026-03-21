"use client";

import { useEffect, useState } from "react";
import {
  getUserStats,
  getUserStreak,
  getUserTopics,
  getUserSkills,
  type UserStats,
  type UserStreak,
  type TopicProgress,
  type SkillProgress,
} from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [topics, setTopics] = useState<TopicProgress[]>([]);
  const [skills, setSkills] = useState<SkillProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getUserStats(1), getUserStreak(1), getUserTopics(1), getUserSkills(1)])
      .then(([s, str, t, sk]) => {
        setStats(s);
        setStreak(str);
        setTopics(t);
        setSkills(sk);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Classify topics: strong = correct > wrong, weak = wrong >= correct (min 1 attempt)
  const strongTopics = topics.filter((t) => t.correct_count > t.wrong_count);
  const weakTopics = topics.filter(
    (t) => t.wrong_count >= t.correct_count && t.wrong_count + t.correct_count > 0
  );

  if (loading) {
    return (
      <div className="flex bg-zinc-50 dark:bg-zinc-950 h-screen w-full items-center justify-center">
        <span className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex bg-zinc-50 dark:bg-zinc-950 h-screen w-full items-center justify-center">
        <p className="text-red-500">Error loading stats: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-6 py-12 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 tracking-[-0.02em]">
              Learning Progress
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">
              Track your gamification statistics and overall performance.
            </p>
          </div>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap shadow-sm shadow-zinc-900/10 active:scale-95"
          >
            ← Back to Chat
          </Link>
        </div>

        {/* Streak Banner */}
        {streak && streak.current_streak >= 2 && (
          <div className="flex items-center gap-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800/30 rounded-2xl px-6 py-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <span className="text-4xl">🔥</span>
            <div>
              <p className="font-semibold text-orange-800 dark:text-orange-300 text-base">
                {streak.current_streak}-day learning streak!
              </p>
              <p className="text-orange-600 dark:text-orange-400/80 text-sm mt-0.5">
                You&apos;re on fire. Come back tomorrow to keep it going!
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">

          {/* Card 1: Total Points */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center gap-4 transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center text-4xl shadow-sm">
              🏆
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">Total Points</p>
              <h2 className="text-5xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                {stats?.total_points.toLocaleString() || 0}
              </h2>
            </div>
          </div>

          {/* Card 2: Accuracy */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center gap-4 transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-4xl shadow-sm">
              🎯
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">Accuracy</p>
              <h2 className="text-5xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                {stats?.accuracy ?? 0}%
              </h2>
            </div>
          </div>

          {/* Card 3: Quizzes Taken */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center gap-4 transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-4xl shadow-sm">
              📝
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">Quizzes Taken</p>
              <h2 className="text-5xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                {stats?.quizzes_taken.toLocaleString() || 0}
              </h2>
            </div>
          </div>

          {/* Card 4: Current Streak */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center gap-4 transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center text-4xl shadow-sm">
              🔥
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">Current Streak</p>
              <h2 className="text-5xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                {streak?.current_streak ?? 0}
              </h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">days in a row</p>
            </div>
          </div>

          {/* Card 5: Longest Streak */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center gap-4 transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center text-4xl shadow-sm">
              ⚡
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">Longest Streak</p>
              <h2 className="text-5xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                {streak?.longest_streak ?? 0}
              </h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">personal best</p>
            </div>
          </div>

        </div>

        {/* Topic Progress — only shown once there's data */}
        {topics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Weak Topics */}
            <div className="bg-white dark:bg-zinc-900/50 border border-red-100 dark:border-red-900/30 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📉</span>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">Needs Practice</h3>
              </div>
              {weakTopics.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">No weak topics yet — great job! 🎉</p>
              ) : (
                <ul className="space-y-2">
                  {weakTopics.map((t) => (
                    <li
                      key={t.topic}
                      className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20"
                    >
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{t.topic}</span>
                      <span className="text-xs text-red-500 dark:text-red-400 font-semibold tabular-nums">
                        {t.correct_count}✓ / {t.wrong_count}✗
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Strong Topics */}
            <div className="bg-white dark:bg-zinc-900/50 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📈</span>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">Strengths</h3>
              </div>
              {strongTopics.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">Keep answering quizzes to build strengths!</p>
              ) : (
                <ul className="space-y-2">
                  {strongTopics.map((t) => (
                    <li
                      key={t.topic}
                      className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20"
                    >
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{t.topic}</span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                        {t.correct_count}✓ / {t.wrong_count}✗
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        )}

        {/* 🧠 Learning Skills — only shown once there's skill data */}
        {skills.length > 0 && (
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">🧠</span>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">Learning Skills</h3>
            </div>
            <ul className="space-y-4">
              {skills.map((s) => {
                const label =
                  s.skill_type === "conceptual" ? "Conceptual"
                  : s.skill_type === "factual" ? "Factual"
                  : "Problem-Solving";
                const icon =
                  s.skill_type === "conceptual" ? "💡"
                  : s.skill_type === "factual" ? "📖"
                  : "⚙️";
                const badge =
                  s.accuracy >= 70
                    ? { label: "Strong", cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" }
                    : s.accuracy >= 40
                    ? { label: "Developing", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" }
                    : { label: "Needs Practice", cls: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" };
                const barColor =
                  s.accuracy >= 70 ? "bg-emerald-500"
                  : s.accuracy >= 40 ? "bg-amber-400"
                  : "bg-red-400";
                return (
                  <li key={s.skill_type} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <span>{icon}</span>{label}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label} — {s.accuracy}%
                      </span>
                    </div>
                    {/* Accuracy progress bar */}
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${s.accuracy}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                      {s.correct_count} correct · {s.wrong_count} wrong · {s.correct_count + s.wrong_count} total
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Motivation Block */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-3xl p-8">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🚀</span>
            <div>
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300">
                Keep up the great work!
              </h3>
              <p className="text-indigo-700 dark:text-indigo-400/90 mt-2 text-base leading-relaxed max-w-2xl">
                Every question you answer helps train your brain. Remember that struggling with a concept is
                the first step towards mastering it. Head back to the chat to learn something new today!
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
