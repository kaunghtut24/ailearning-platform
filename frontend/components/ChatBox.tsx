"use client";

import { useEffect, useRef, useState } from "react";
import { sendMessage, getMessages, type Level } from "@/lib/api";
import { useStreamingText } from "@/hooks/useStreamingText";
import { MessageBubble } from "@/components/MessageBubble";

type Role = "user" | "ai";

interface Message {
  id: number;
  role: Role;
  text: string;
  isStreaming?: boolean; // true while words are being appended
}

interface ChatBoxProps {
  /** Active conversation ID (null = no conversation started yet). */
  conversationId: string | null;
  /** Notify parent when the conversation ID is resolved/confirmed. */
  setConversationId: (id: string) => void;
  /** Notify parent when the very first message is sent so it can register the session. */
  onNewConversation: (id: string, title: string) => void;
  /** Triggered when the hamburger menu is clicked */
  onToggleSidebar?: () => void;
}

const USER_ID = 1;
/** Max characters to use from the first message as the conversation title. */
const TITLE_MAX_CHARS = 40;

export default function ChatBox({
  conversationId,
  setConversationId,
  onNewConversation,
  onToggleSidebar,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState<Level>("primary");
  const [isThinking, setIsThinking] = useState(false); // true while waiting for API
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { streaming, startStreaming } = useStreamingText(setMessages, () =>
    inputRef.current?.focus(),
  );

  // Disable input + send during both API wait and word animation
  const busy = isThinking || streaming;

  // Auto-scroll whenever messages change or loading state toggles
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Reset state on conversation change
  useEffect(() => {
    console.log("Loading conversation:", conversationId);
    setMessages([]);
    setIsHydrated(false);
  }, [conversationId]);

  // Load message history if conversationId is provided on mount
  useEffect(() => {
    if (!conversationId) return;

    setIsThinking(true);
    getMessages(conversationId)
      .then((msgs) => {
        setMessages(
          msgs.map((m) => ({
            id: m.id,
            role: m.role,
            text: m.content,
            isStreaming: false,
          }))
        );
        setIsHydrated(true);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsThinking(false));
  }, [conversationId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || busy) return;

    // Generate a conversation ID on the very first message of this session.
    // All subsequent messages reuse the same ID so the backend keeps one history.
    const isNew = conversationId === null;
    const cid = conversationId ?? crypto.randomUUID();
    console.log("Sending CID:", cid);

    // Register the new session in the sidebar immediately (before the API call)
    // using the first user message as the title, truncated to TITLE_MAX_CHARS.
    if (isNew) {
      const title =
        text.length > TITLE_MAX_CHARS
          ? text.slice(0, TITLE_MAX_CHARS).trimEnd() + "…"
          : text;
      onNewConversation(cid, title);
      setConversationId(cid);
    }

    const userMsg: Message = { id: Date.now(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setIsThinking(true);

    try {
      // Phase A: fetch — "AI is thinking…" shown via loading state
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
        { id: aiMsgId, role: "ai", text: "", isStreaming: true },
      ]);
      setIsThinking(false);
      startStreaming(aiMsgId, result.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsThinking(false);
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
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-700 px-4 py-3 flex items-center justify-between gap-4 shrink-0">
        {/* Left: title + subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="p-1.5 -ml-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-500 dark:text-zinc-400 transition-colors"
              title="Toggle Sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          )}
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
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <div className="max-w-[900px] mx-auto w-full space-y-4">
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
            isStreaming={msg.isStreaming}
          />
        ))}

        {/* Phase A indicator: shown while waiting for the API to respond */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-zinc-400 flex items-center gap-2 transition-all">
              <span className="text-xs font-medium tracking-wide">AI is thinking...</span>
              <span className="flex gap-1" aria-hidden="true">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-[bounce_1s_infinite_0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-[bounce_1s_infinite_150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-[bounce_1s_infinite_300ms]" />
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

        <div ref={bottomRef} className="h-2" />
        </div>
      </div>

      {/* Input row */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-3 shrink-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm z-10 transition-colors">
        <div className="max-w-[900px] mx-auto flex gap-2 w-full">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question…"
          disabled={busy}
          className="flex-1 rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || busy}
          className="rounded-full bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-900 transition-opacity hover:opacity-80 disabled:opacity-30"
        >
          Send
        </button>
      </div>
    </div>
  </div>
  );
}
