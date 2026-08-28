import { useEffect, useState } from "react";
import { useApp } from "../store/AppState";
import { Navigate } from "react-router-dom";

export default function Admin() {
  const { user, config, setConfig, setAnnouncement, announcement, friends } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ launches: 0 });
  const [banner, setBanner] = useState(announcement);
  const [flags, setFlags] = useState({
    modrinth: config.featureFlags?.modrinth !== false,
    friendsChat: config.featureFlags?.friendsChat !== false,
    autoUpdater: config.featureFlags?.autoUpdater !== false,
  });

  useEffect(() => {
    (async () => {
      if (window.nexus) {
        setUsers(await window.nexus.listUsers());
        setStats(await window.nexus.getStats());
      } else if (user) setUsers([user]);
    })();
  }, [user]);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  async function changeRole(username: string, role: string) {
    if (window.nexus) await window.nexus.updateUser({ username, role });
    setUsers(users.map((u) => (u.username === username ? { ...u, role } : u)));
  }

  async function ban(username: string, banned: boolean) {
    if (window.nexus) await window.nexus.updateUser({ username, banned });
    setUsers(users.map((u) => (u.username === username ? { ...u, banned } : u)));
  }

  async function del(username: string) {
    if (window.nexus) await window.nexus.deleteUser(username);
    setUsers(users.filter((u) => u.username !== username));
  }

  async function saveBanner() {
    setAnnouncement(banner);
    const next = window.nexus ? await window.nexus.saveConfig({ announcement: banner }) : { ...config, announcement: banner };
    setConfig(next);
  }

  async function saveFlags() {
    const next = window.nexus
      ? await window.nexus.saveConfig({ featureFlags: flags, modrinthEnabled: flags.modrinth })
      : { ...config, featureFlags: flags };
    setConfig(next);
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Panel</h1>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total Users" value={users.length} />
        <Stat label="Instances Launched" value={stats.launches || 0} />
        <Stat label="Online Users" value={friends.filter((f) => f.online).length + 1} />
      </div>

      <section className="card p-4 overflow-auto">
        <div className="label mb-3">User Management</div>
        <table className="w-full text-sm">
          <thead className="text-zinc-500 text-left">
            <tr>
              <th className="py-2">Username</th>
              <th>Role</th>
              <th>UUID</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.username} className="border-t border-nexus-border">
                <td className="py-2">
                  {u.username} {u.banned ? <span className="text-red-400 text-xs">BANNED</span> : null}
                </td>
                <td>
                  <select className="bg-[#101018] border border-nexus-border rounded px-2 py-1" value={u.role} onChange={(e) => changeRole(u.username, e.target.value)}>
                    {["admin", "mod", "user", "beta"].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td className="font-mono text-xs">{u.uuid}</td>
                <td className="text-xs text-zinc-500">{u.lastSeen ? new Date(u.lastSeen).toLocaleString() : "–"}</td>
                <td className="space-x-2">
                  <button className="btn text-xs" onClick={() => ban(u.username, !u.banned)}>
                    {u.banned ? "Unban" : "Ban"}
                  </button>
                  <button className="btn text-xs" onClick={() => del(u.username)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card p-4">
        <div className="label">Announcements</div>
        <input className="input mt-2" value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="Globales Banner…" />
        <button className="btn-primary mt-3 px-4 py-2 rounded-lg" onClick={saveBanner}>
          Banner setzen
        </button>
      </section>

      <section className="card p-4 space-y-2">
        <div className="label">Feature Flags</div>
        {(["modrinth", "friendsChat", "autoUpdater"] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm capitalize">
            <input
              type="checkbox"
              checked={(flags as any)[k]}
              onChange={(e) => setFlags({ ...flags, [k]: e.target.checked })}
            />
            {k}
          </label>
        ))}
        <button className="btn mt-2" onClick={saveFlags}>
          Flags speichern
        </button>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
