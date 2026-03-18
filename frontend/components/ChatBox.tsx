"use client";

import { useEffect, useRef, useState } from "react";
import { sendMessage } from "@/lib/api";

type Role = "user" | "ai";

interface Message {
  id: number;
  role: Role;
  text: string;
  streaming?: boolean; // true while words are being appended
}

const USER_ID = 1;
const WORD_INTERVAL_MS = 55; // delay between each word appearing

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);   // true while waiting for API
  const [streaming, setStreaming] = useState(false); // true while animating words
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Disable input + send during both API wait and word animation
  const busy = loading || streaming;

  // Clean up any running interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Auto-scroll whenever messages change or loading state toggles
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /** Append words one-by-one into the AI message placeholder. */
  function startStreaming(aiMsgId: number, fullText: string) {
    const words = fullText.split(" ");
    let wordIndex = 0;
    setStreaming(true);

    intervalRef.current = setInterval(() => {
      wordIndex++;
      const partial = words.slice(0, wordIndex).join(" ");
      const done = wordIndex >= words.length;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, text: partial, streaming: !done } : m
        )
      );

      if (done) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setStreaming(false);
        inputRef.current?.focus();
      }
    }, WORD_INTERVAL_MS);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || busy) return;

    const userMsg: Message = { id: Date.now(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      // Phase A: fetch — "AI is typing…" shown via loading state
      const result = await sendMessage({ user_id: USER_ID, message: text });

      // Phase B: stream — add empty placeholder, then animate words into it
      const aiMsgId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "ai", text: "", streaming: true },
      ]);
      setLoading(false);
      startStreaming(aiMsgId, result.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-700 px-4 py-3 flex items-center gap-2">
        <span className="text-xl">🎓</span>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          AI Teacher
        </h1>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-zinc-400 dark:text-zinc-500 mt-16 text-sm">
            Ask your AI teacher anything to get started.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-br-sm"
                  : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-bl-sm"
              }`}
            >
              {msg.text}
              {/* Blinking cursor shown while this bubble is streaming */}
              {msg.streaming && (
                <span className="inline-block w-[2px] h-[1em] bg-current align-middle ml-0.5 animate-pulse" />
              )}
            </div>
          </div>
        ))}

        {/* Phase A indicator: shown while waiting for the API to respond */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-2 text-sm text-zinc-400 flex items-center gap-1.5">
              <span className="text-xs">AI is typing</span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            ⚠️ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question…"
          disabled={busy}
          className="flex-1 rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || busy}
          className="rounded-full bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-opacity hover:opacity-80 disabled:opacity-30"
        >
          Send
        </button>
      </div>
    </div>
  );
}

