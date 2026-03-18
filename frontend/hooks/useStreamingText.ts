"use client";

import { useEffect, useRef, useState } from "react";

const WORD_INTERVAL_MS = 55; // delay between each word appearing

/** Minimal shape the hook needs to update a message in the list. */
interface StreamableMessage {
  id: number;
  text: string;
  isStreaming?: boolean;
}

type SetMessages<T extends StreamableMessage> = React.Dispatch<
  React.SetStateAction<T[]>
>;

interface UseStreamingTextResult {
  streaming: boolean;
  startStreaming: (msgId: number, fullText: string) => void;
}

/**
 * Encapsulates the word-by-word streaming animation.
 *
 * @param setMessages  The React state setter for the message array.
 * @param onDone       Optional callback invoked when streaming finishes.
 */
export function useStreamingText<T extends StreamableMessage>(
  setMessages: SetMessages<T>,
  onDone?: () => void,
): UseStreamingTextResult {
  const [streaming, setStreaming] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up any running interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startStreaming(msgId: number, fullText: string) {
    const words = fullText.split(" ");
    let wordIndex = 0;
    setStreaming(true);

    intervalRef.current = setInterval(() => {
      wordIndex++;
      const partial = words.slice(0, wordIndex).join(" ");
      const done = wordIndex >= words.length;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? ({ ...m, text: partial, isStreaming: !done } as T)
            : m,
        ),
      );

      if (done) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setStreaming(false);
        onDone?.();
      }
    }, WORD_INTERVAL_MS);
  }

  return { streaming, startStreaming };
}

