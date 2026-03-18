"use client";

import { useEffect, useRef, useState } from "react";
import { sendMessage, type Level } from "@/lib/api";
import { useStreamingText } from "@/hooks/useStreamingText";
import { MessageBubble } from "@/components/MessageBubble";

type Role = "user" | "ai";

interface Message {
  id: number;
  role: Role;
  text: string;
  streaming?: boolean; // true while words are being appended
}

const USER_ID = 1;


export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState<Level>("primary");
  const [loading, setLoading] = useState(false); // true while waiting for API
  const [error, setError] = useState<string | null>(null);
  // null until the first message is sent; then fixed for the lifetime of this session
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { streaming, startStreaming } = useStreamingText(setMessages, () =>
    inputRef.current?.focus(),
  );

  // Disable input + send during both API wait and word animation
  const busy = loading || streaming;

  // Auto-scroll whenever messages change or loading state toggles
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || busy) return;

    // Generate a conversation ID on the very first message of this session.
    // All subsequent messages reuse the same ID so the backend keeps one history.
    const cid = conversationId ?? crypto.randomUUID();
    if (!conversationId) setConversationId(cid);

    const userMsg: Message = { id: Date.now(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      // Phase A: fetch — "AI is typing…" shown via loading state
      const result = await sendMessage({
        user_id: USER_ID,
        message: text,
        level,
        conversation_id: cid,
      });

      // Keep our local ID in sync with whatever the backend confirmed
      setConversationId(result.conversation_id);

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
      <div className="border-b border-zinc-200 dark:border-zinc-700 px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: title + subtitle */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl">🎓</span>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
              AI Teacher
            </h1>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
              Ask anything and learn step-by-step
            </p>
          </div>
        </div>

        {/* Right: level selector */}
        <div className="flex items-center gap-2 shrink-0">
          <label
            htmlFor="level-select"
            className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap"
          >
            Level:
          </label>
          <select
            id="level-select"
            value={level}
            onChange={(e) => setLevel(e.target.value as Level)}
            disabled={busy}
            className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50 cursor-pointer"
          >
            <option value="primary">🟢 Primary</option>
            <option value="middle">🟡 Middle</option>
            <option value="secondary">🔴 Secondary</option>
          </select>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-zinc-400 dark:text-zinc-500 mt-16 text-sm">
            Ask your AI teacher anything to get started.
          </p>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            text={msg.text}
            streaming={msg.streaming}
          />
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

