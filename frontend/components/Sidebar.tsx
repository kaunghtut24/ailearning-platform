import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface Conversation {
  id: string;
  title: string;
  snippet?: string;
  key?: string;
}

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onSearch: (q: string, mode: "titles" | "messages") => void;
}

export function Sidebar({
  conversations,
  activeId,
  onNewChat,
  onSelect,
  onRename,
  onDelete,
  onSearch,
}: SidebarProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<"titles" | "messages">("titles");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm, searchMode);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchMode, onSearch]);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  function startEdit(conv: Conversation, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  }

  function submitEdit() {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  }
  return (
    <aside className="w-full shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full bg-zinc-50 dark:bg-zinc-900">
      {/* App brand */}
      <div className="px-4 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">🎓</span>
        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
          AI Teacher
        </span>
      </div>

      {/* Search Input */}
      <div className="px-3 pt-3">
        <input
          ref={inputRef}
          type="text"
          placeholder={searchMode === "titles" ? "Search by title..." : "Search in messages..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600 transition-all"
        />
      </div>

      {/* Search Mode Toggles (Advanced Filtering) */}
      <div className="px-3 pt-2 flex items-center justify-between gap-1.5 bg-transparent rounded-lg">
        <button 
          onClick={() => {
            setSearchMode("titles");
            inputRef.current?.focus();
          }}
          className={`flex-1 text-[10px] uppercase font-bold tracking-wider py-1.5 rounded-md transition-all ${
            searchMode === "titles" 
              ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" 
              : "text-zinc-500 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
          title="Filter conversations by their titles"
        >
          Titles
        </button>
        <button 
          onClick={() => {
            setSearchMode("messages");
            inputRef.current?.focus();
          }}
          className={`flex-1 text-[10px] uppercase font-bold tracking-wider py-1.5 rounded-md transition-all ${
            searchMode === "messages" 
              ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" 
              : "text-zinc-500 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
          title="Search for keywords inside all message history"
        >
          Messages
        </button>
      </div>

      {/* New Chat button */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <span aria-hidden="true">＋</span>
          New Chat
        </button>
      </div>

      {/* Conversations list */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {conversations.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center mt-8 px-4 leading-relaxed">
            No conversations yet.
            <br />
            Start chatting!
          </p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.key || conv.id}
              onClick={() => onSelect(conv.id)}
              className={`group w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between cursor-pointer transition-colors ${
                conv.id === activeId
                  ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {editingId === conv.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={submitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-1 py-0.5 rounded outline-none w-full min-w-0"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center" title={conv.title}>
                    <span aria-hidden="true" className="mr-1.5 shrink-0">💬</span>
                    <span className="truncate flex-1">{conv.title}</span>
                  </div>
                  {conv.snippet && (
                    <div className="text-xs text-zinc-500 mt-1 pl-6 overflow-hidden max-h-[2.4em] leading-[1.2em]" title={conv.snippet}>
                      {conv.snippet}
                    </div>
                  )}
                </div>
              )}
              
              {!editingId && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                  <button
                    onClick={(e) => startEdit(conv, e)}
                    className="p-1 hover:text-zinc-900 dark:hover:text-white"
                    title="Rename"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    className="p-1 hover:text-red-500"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </nav>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 border-opacity-50 mt-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-500 dark:bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors shadow-sm active:scale-[0.98]"
        >
          <span aria-hidden="true">📊</span>
          Dashboard
        </button>
      </div>
    </aside>
  );
}

