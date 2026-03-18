"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar, type Conversation } from "@/components/Sidebar";
import ChatBox from "@/components/ChatBox";
import { getConversations, updateConversationTitle, deleteConversation, searchMessages } from "@/lib/api";

export default function Home() {
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // chatKey changes only on explicit navigation so ChatBox remounts (clears messages)
  // without remounting mid-conversation when conversationId is first assigned.
  const [chatKey, setChatKey] = useState(0);

  useEffect(() => {
    // For MVP, user_id is hardcoded to 1
    getConversations(1).then((data) => {
      const mapped = data.map((c) => ({ id: c.id, title: c.title }));
      setAllConversations(mapped);
      setFilteredConversations(mapped);
    }).catch(console.error);
  }, []);

  const handleSearch = useCallback((q: string, mode: "titles" | "messages" = "titles") => {
    // For MVP, user_id is hardcoded to 1
    if (mode === "titles" || !q) {
      getConversations(1, q)
        .then((data) => {
          setFilteredConversations(data.map((c) => ({ id: c.id, title: c.title })));
        })
        .catch(console.error);
    } else {
      searchMessages(1, q)
        .then((data) => {
          setFilteredConversations(
            data.map((m, idx) => ({
              id: m.conversation_id,
              title: m.title,
              snippet: m.content,
              key: `${m.conversation_id}-${idx}`, // secure key map when duplicating channel rows
            }))
          );
        })
        .catch(console.error);
    }
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
    const addConv = (prev: Conversation[]) => {
      if (prev.some((c) => c.id === id)) return prev;
      return [{ id, title }, ...prev];
    };
    setAllConversations(addConv);
    setFilteredConversations(addConv);
  }

  async function handleRename(id: string, newTitle: string) {
    try {
      await updateConversationTitle(id, newTitle);
      const updateFn = (prev: Conversation[]) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c));
      setAllConversations(updateFn);
      setFilteredConversations(updateFn);
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteConversation(id);
      const filterFn = (prev: Conversation[]) => prev.filter((c) => c.id !== id);
      setAllConversations(filterFn);
      setFilteredConversations(filterFn);
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
        conversations={filteredConversations}
        activeId={activeId}
        onNewChat={handleNewChat}
        onSelect={handleSelectConversation}
        onRename={handleRename}
        onDelete={handleDelete}
        onSearch={handleSearch}
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
