"use client";

import { useEffect, useState } from "react";
import { Sidebar, type Conversation } from "@/components/Sidebar";
import ChatBox from "@/components/ChatBox";
import { getConversations, updateConversationTitle, deleteConversation } from "@/lib/api";

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // chatKey changes only on explicit navigation so ChatBox remounts (clears messages)
  // without remounting mid-conversation when conversationId is first assigned.
  // without remounting mid-conversation when conversationId is first assigned.
  const [chatKey, setChatKey] = useState(0);

  useEffect(() => {
    // For MVP, user_id is hardcoded to 1
    getConversations(1).then((data) => {
      setConversations(data.map((c) => ({ id: c.id, title: c.title })));
    }).catch(console.error);
  }, []);

  function handleNewChat() {
    setActiveId(null);
    setChatKey((k) => k + 1);
  }

  function handleSelectConversation(id: string) {
    if (id === activeId) return; // already active, no remount needed
    setActiveId(id);
    setChatKey((k) => k + 1);
  }

  /** Called by ChatBox the first time a message is sent in a new session. */
  function handleNewConversation(id: string, title: string) {
    setActiveId(id);
    setConversations((prev) => {
      if (prev.some((c) => c.id === id)) return prev; // guard against double-fire
      return [{ id, title }, ...prev];                 // newest first
    });
  }

  async function handleRename(id: string, newTitle: string) {
    try {
      await updateConversationTitle(id, newTitle);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
      );
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setChatKey((k) => k + 1);
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  }

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onNewChat={handleNewChat}
        onSelect={handleSelectConversation}
        onRename={handleRename}
        onDelete={handleDelete}
      />
      <main className="flex-1 min-w-0">
        <ChatBox
          key={chatKey}
          conversationId={activeId}
          setConversationId={setActiveId}
          onNewConversation={handleNewConversation}
        />
      </main>
    </div>
  );
}
