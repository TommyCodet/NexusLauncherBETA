import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppState";

const roleBadge: Record<string, string> = {
  admin: "bg-red-600/80",
  mod: "bg-blue-600/80",
  beta: "bg-purple-600/80",
  user: "bg-zinc-600/80",
};

export default function Header({ onFriends }: { onFriends: () => void }) {
  const { user, onlineCount } = useApp();
  const nav = useNavigate();
  const isAdmin = user?.role === "admin";

  return (
    <header className="h-14 border-b border-nexus-border flex items-center justify-between px-6">
      <div className="font-extrabold tracking-[0.2em] text-transparent bg-clip-text bg-logo-gradient">
        NEXUS
      </div>
      <div className="flex items-center gap-3">
        {isAdmin && (
          <button
            onClick={() => nav("/admin")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30"
          >
            Admin Panel
          </button>
        )}
        <button
          onClick={onFriends}
          className="relative p-2 rounded-lg hover:bg-[#1a1a26] text-zinc-300"
          title="Friends"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4z" />
          </svg>
          {onlineCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-[10px] font-bold text-black flex items-center justify-center">
              {onlineCount}
            </span>
          )}
        </button>
        {user && (
          <div className="flex items-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-full bg-logo-gradient flex items-center justify-center text-xs font-bold">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">{user.username}</div>
              <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${roleBadge[user.role] || roleBadge.user}`}>
                {user.role}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
