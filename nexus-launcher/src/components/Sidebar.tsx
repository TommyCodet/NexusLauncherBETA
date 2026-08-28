import { NavLink } from "react-router-dom";
import Logo from "./Logo";

const items = [
  { to: "/", label: "Instances", icon: Grid },
  { to: "/play", label: "Play", icon: Play },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/mods", label: "Mods", icon: Puzzle },
  { to: "/logs", label: "Logs", icon: File },
  { to: "/settings", label: "Settings", icon: Cog },
];

function Grid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function Play() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function User() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 14.5-4 16 0" />
    </svg>
  );
}
function Puzzle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 4h4v3a2 2 0 104 0V4h2a2 2 0 012 2v2h-3a2 2 0 100 4h3v2a2 2 0 01-2 2h-2v-3a2 2 0 10-4 0v3H8a2 2 0 01-2-2v-2h3a2 2 0 100-4H6V6a2 2 0 012-2h2z" />
    </svg>
  );
}
function File() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
function Cog() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </svg>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-[220px] shrink-0 h-full border-r border-nexus-border bg-[#0c0c14] flex flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <Logo size={26} />
        <span className="font-extrabold tracking-wide text-transparent bg-clip-text bg-logo-gradient text-lg">
          NEXUS
        </span>
      </div>
      <nav className="px-3 space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                isActive
                  ? "bg-[#1a1a3a] text-white border border-[#3b3b6a]"
                  : "text-zinc-400 hover:text-white hover:bg-[#151522]"
              }`
            }
          >
            <it.icon />
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto px-4 py-4 text-[11px] text-zinc-600">NEXUS Client 1.0.0</div>
    </aside>
  );
}
