import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppState";
import type { NexusInstance } from "../vite-env";

const ICONS: Record<string, string> = {
  grass: "🟩",
  sword: "⚔️",
  gear: "⚙️",
  crystal: "💎",
  pack: "📦",
};

export default function Instances() {
  const { instances, setInstances, setSelectedInstanceId } = useApp();
  const nav = useNavigate();
  const [modal, setModal] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", version: "1.21", loader: "Vanilla" as NexusInstance["loader"] });
  const [versions, setVersions] = useState<{ id: string; type: string }[]>([]);

  async function openCreate() {
    setModal(true);
    if (window.nexus) {
      const v = await window.nexus.fetchVersions();
      setVersions(v.filter((x) => x.type === "release").slice(0, 40));
    } else {
      setVersions(["1.21.4", "1.21", "1.20.4", "1.20.1", "1.19.2"].map((id) => ({ id, type: "release" })));
    }
  }

  function create() {
    const inst: NexusInstance = {
      id: crypto.randomUUID(),
      name: form.name || "Neue Instance",
      version: form.version,
      loader: form.loader,
      ramMb: 2048,
      playedMs: 0,
      icon: form.loader === "Fabric" ? "sword" : form.loader === "Forge" ? "gear" : "grass",
      createdAt: Date.now(),
    };
    setInstances([...instances, inst]);
    setModal(false);
  }

  async function play(id: string) {
    setSelectedInstanceId(id);
    const inst = instances.find((i) => i.id === id);
    if (window.nexus?.launch && inst) {
      const res = await window.nexus.launch({
        name: inst.name,
        version: inst.version,
        ramMb: inst.ramMb,
        javaPath: inst.javaPath,
      });
      if (!res?.ok) nav("/play");
      return;
    }
    window.nexus?.incrementLaunch();
    nav("/play");
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Instances</h1>
        <button onClick={openCreate} className="btn-primary px-4 py-2 rounded-lg">
          + Neue Instance
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {instances.map((inst) => (
          <div key={inst.id} className="card p-4 relative">
            <button className="absolute top-3 right-3 text-zinc-500" onClick={() => setMenu(menu === inst.id ? null : inst.id)}>
              ⋯
            </button>
            {menu === inst.id && (
              <div className="absolute right-3 top-10 z-10 card p-1 text-sm w-40">
                <MenuItem
                  label="Edit"
                  onClick={() => {
                    const name = prompt("Name", inst.name);
                    if (name) setInstances(instances.map((i) => (i.id === inst.id ? { ...i, name } : i)));
                    setMenu(null);
                  }}
                />
                <MenuItem
                  label="Folder"
                  onClick={() => {
                    window.nexus?.openFolder(`${inst.name.replace(/\s+/g, "_")}`);
                    setMenu(null);
                  }}
                />
                <MenuItem
                  label="Export (.mrpack)"
                  onClick={() => {
                    alert("Export als .mrpack vorbereitet (Platzhalter).");
                    setMenu(null);
                  }}
                />
                <MenuItem
                  label="Settings"
                  onClick={() => {
                    const ram = prompt("RAM MB", String(inst.ramMb));
                    if (ram) setInstances(instances.map((i) => (i.id === inst.id ? { ...i, ramMb: Number(ram) } : i)));
                    setMenu(null);
                  }}
                />
                <MenuItem
                  label="Delete"
                  onClick={() => {
                    setInstances(instances.filter((i) => i.id !== inst.id));
                    setMenu(null);
                  }}
                />
              </div>
            )}
            <div className="h-20 flex items-center justify-center text-4xl">{ICONS[inst.icon] || "🟩"}</div>
            <div className="font-medium text-center">{inst.name}</div>
            <div className="text-xs text-zinc-500 text-center">{inst.version}</div>
            <div className="flex justify-center mt-2">
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  inst.loader === "Fabric"
                    ? "bg-purple-600/30 text-purple-300"
                    : inst.loader === "Forge"
                    ? "bg-cyan-700/30 text-cyan-300"
                    : "bg-green-700/30 text-green-300"
                }`}
              >
                {inst.loader}
              </span>
            </div>
            <div className="text-xs text-zinc-500 mt-3">RAM: {(inst.ramMb / 1024).toFixed(inst.ramMb % 1024 ? 1 : 0)} GB</div>
            <button onClick={() => play(inst.id)} className="btn-primary w-full mt-3 py-2 rounded-lg flex items-center justify-center gap-2">
              ▶ Play
            </button>
            <div className="flex justify-center gap-3 mt-3 text-zinc-500">
              <span title="Edit">✎</span>
              <span title="Copy">⧉</span>
              <span title="Delete">🗑</span>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-30 bg-black/60 flex items-center justify-center">
          <div className="card w-[480px] p-6">
            <h2 className="text-lg font-semibold mb-4">Neue Instance</h2>
            <div className="label">Name</div>
            <input className="input mb-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="label">Version</div>
            <select className="input mb-3" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })}>
              {(versions.length ? versions : [{ id: "1.21", type: "release" }]).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id}
                </option>
              ))}
            </select>
            <div className="label">Modloader</div>
            <select
              className="input mb-5"
              value={form.loader}
              onChange={(e) => setForm({ ...form, loader: e.target.value as any })}
            >
              {["Vanilla", "Fabric", "Forge", "NeoForge", "Quilt"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button className="btn" onClick={() => setModal(false)}>
                Abbrechen
              </button>
              <button className="btn-primary px-4 py-2 rounded-lg" onClick={create}>
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="block w-full text-left px-3 py-1.5 hover:bg-[#1a1a26] rounded" onClick={onClick}>
      {label}
    </button>
  );
}
