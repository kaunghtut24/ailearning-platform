"use client";

import { useEffect, useState } from "react";
import { getUserStats, getUserStreak, type UserStats, type UserStreak } from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getUserStats(1), getUserStreak(1)])
      .then(([s, str]) => {
        setStats(s);
        setStreak(str);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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

        {/* Streak Banner — only shown when user has an active streak */}
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

        {/* Extra Motivation Block */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-3xl p-8 mt-6">
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

