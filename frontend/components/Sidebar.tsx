import { useState, useRef, useEffect } from "react";

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
    <aside className="w-[250px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-screen bg-zinc-50 dark:bg-zinc-900">
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
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
        />
      </div>

      {/* Mode Toggle */}
      <div className="px-3 pt-2 flex gap-2">
        <button 
          onClick={() => setSearchMode("titles")}
          className={`flex-1 text-xs py-1 rounded-md transition-colors ${searchMode === "titles" ? "bg-zinc-200 dark:bg-zinc-700 font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
          Titles
        </button>
        <button 
          onClick={() => setSearchMode("messages")}
          className={`flex-1 text-xs py-1 rounded-md transition-colors ${searchMode === "messages" ? "bg-zinc-200 dark:bg-zinc-700 font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
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
    </aside>
  );
}

