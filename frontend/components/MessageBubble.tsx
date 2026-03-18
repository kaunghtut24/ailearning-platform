import { useState } from "react";

type Role = "user" | "ai";

interface MessageBubbleProps {
  role: Role;
  text: string;
  isStreaming?: boolean;
}

/**
 * Renders a single chat bubble.
 * User messages are right-aligned; AI messages are left-aligned.
 * While `isStreaming` is true a blinking cursor is appended.
 */
export function MessageBubble({ role, text, isStreaming }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`flex w-full ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative group max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap transition-colors ${
          role === "user"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-br-sm shadow-sm"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-bl-sm shadow-sm border border-zinc-200/50 dark:border-zinc-700/50"
        }`}
      >
        {role === "ai" && !isStreaming && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700"
            title={copied ? "Copied to clipboard!" : "Copy response"}
            aria-label="Copy message"
          >
            {copied ? (
              <span className="text-xs font-medium px-1">Copied!</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            )}
          </button>
        )}
        
        <div className={role === "ai" ? "pr-8 pt-0.5" : ""}>
          {text}
          {/* Blinking cursor shown while this bubble is streaming */}
          {isStreaming && (
            <span className="inline-block w-[2px] h-[1em] bg-current align-middle ml-0.5 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

