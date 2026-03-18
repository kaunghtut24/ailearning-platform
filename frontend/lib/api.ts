const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Level = "primary" | "middle" | "secondary";

export interface ChatPayload {
  user_id: number;
  message: string;
  level?: Level;
  /** Pass the value from the previous response to continue an existing session. */
  conversation_id?: string;
}

export interface ChatResult {
  response: string;
  /** Echo this back in the next request to keep the same conversation session. */
  conversation_id: string;
}

export async function sendMessage(payload: ChatPayload): Promise<ChatResult> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${detail}`);
  }

  return res.json() as Promise<ChatResult>;
}

