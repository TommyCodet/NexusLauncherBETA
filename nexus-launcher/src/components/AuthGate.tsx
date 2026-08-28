import { useState } from "react";
import Logo from "./Logo";
import { useApp } from "../store/AppState";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, setUser, config } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (user) return <>{children}</>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!window.nexus) {
      setUser({ username: username || "Player", uuid: "local", role: "admin" });
      return;
    }
    const fn = mode === "register" ? window.nexus.registerUser : window.nexus.loginUser;
    const res = await fn({ username, password });
    if (!res.ok) setError(res.error || "Fehler");
    else setUser(res.user);
  }

  return (
    <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
      <form onSubmit={submit} className="card w-[420px] p-8 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Logo size={36} />
          <div>
            <div className="font-extrabold text-transparent bg-clip-text bg-logo-gradient text-xl">NEXUS</div>
            <div className="text-xs text-zinc-500">Launcher-Konto (nicht Microsoft)</div>
          </div>
        </div>
        <div>
          <div className="label">Username</div>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <div className="label">Passwort</div>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="text-sm text-red-400">{error}</div>}
        <button className="btn-primary w-full py-2.5 rounded-lg">{mode === "login" ? "Anmelden" : "Konto erstellen"}</button>
        <button type="button" className="text-sm text-cyan-400" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Erstes Konto erstellen" : "Schon registriert? Login"}
        </button>
        <p className="text-[11px] text-zinc-500">
          Beim ersten Start wird der User automatisch Admin. Microsoft-Login erfolgt später unter Play.
          {config?.clientId ? "" : ""}
        </p>
      </form>
    </div>
  );
}
