const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface ChatPayload {
  user_id: number;
  message: string;
  level?: "primary" | "middle" | "secondary";
}

export interface ChatResult {
  response: string;
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

