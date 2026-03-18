export interface Conversation {
  id: string;
  title: string;
}

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onNewChat: () => void;
  onSelect: (id: string) => void;
}

export function Sidebar({
  conversations,
  activeId,
  onNewChat,
  onSelect,
}: SidebarProps) {
  return (
    <aside className="w-[250px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* App brand */}
      <div className="px-4 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">🎓</span>
        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
          AI Teacher
        </span>
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
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              title={conv.title}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                conv.id === activeId
                  ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span aria-hidden="true" className="mr-1.5">💬</span>
              {conv.title}
            </button>
          ))
        )}
      </nav>
    </aside>
  );
}

