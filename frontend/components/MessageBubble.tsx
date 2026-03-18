type Role = "user" | "ai";

interface MessageBubbleProps {
  role: Role;
  text: string;
  streaming?: boolean;
}

/**
 * Renders a single chat bubble.
 * User messages are right-aligned; AI messages are left-aligned.
 * While `streaming` is true a blinking cursor is appended.
 */
export function MessageBubble({ role, text, streaming }: MessageBubbleProps) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
          role === "user"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-br-sm"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-bl-sm"
        }`}
      >
        {text}
        {/* Blinking cursor shown while this bubble is streaming */}
        {streaming && (
          <span className="inline-block w-[2px] h-[1em] bg-current align-middle ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
}

