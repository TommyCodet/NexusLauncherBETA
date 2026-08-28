import { useApp } from "../store/AppState";

export default function Profile() {
  const { user, setUser, msAccount } = useApp();
  return (
    <div className="p-8 max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <section className="card p-5 flex gap-4 items-center">
        <div className="w-16 h-16 rounded-xl bg-logo-gradient flex items-center justify-center text-2xl font-bold">
          {(msAccount?.name || user?.username || "?").slice(0, 1)}
        </div>
        <div>
          <div className="text-lg font-medium">{msAccount?.name || user?.username}</div>
          <div className="text-xs text-zinc-500 font-mono">UUID {msAccount?.uuid || user?.uuid}</div>
          <div className="text-xs mt-1 uppercase text-zinc-400">Launcher-Rolle: {user?.role}</div>
        </div>
      </section>
      <p className="text-sm text-zinc-400">
        Microsoft-Skin wird angezeigt, sobald der OAuth-Flow mit gültiger Entra Client-ID abgeschlossen ist.
      </p>
      <button className="btn" onClick={() => setUser(null)}>
        Launcher abmelden
      </button>
    </div>
  );
}
