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

export interface Conversation {
  id: string;
  user_id: number;
  title: string;
  created_at: string;
}

export interface StoredMessage {
  id: number;
  conversation_id: string;
  role: "user" | "ai";
  content: string;
  created_at: string;
}

export async function getConversations(userId: number): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/api/conversations?user_id=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

export async function getMessages(conversationId: string): Promise<StoredMessage[]> {
  const res = await fetch(`${API_BASE}/api/messages?conversation_id=${conversationId}`);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function updateConversationTitle(id: string, title: string) {
  const res = await fetch(`${API_BASE}/api/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update title");
  return res.json();
}

export async function deleteConversation(id: string) {
  const res = await fetch(`${API_BASE}/api/conversations/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete conversation");
  return res.json();
}

