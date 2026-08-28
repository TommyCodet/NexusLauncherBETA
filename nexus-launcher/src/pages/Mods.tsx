import { useEffect, useState } from "react";
import { useApp } from "../store/AppState";

const CATS = ["adventure", "technology", "magic", "decoration", "utility", "optimization"];
const TYPES = [
  { id: "mod", label: "Mods" },
  { id: "modpack", label: "Modpacks" },
  { id: "resourcepack", label: "Resource Packs" },
  { id: "shader", label: "Shader Packs" },
];

export default function Mods() {
  const { instances, selectedInstanceId, setInstances, config } = useApp();
  const [q, setQ] = useState("");
  const [type, setType] = useState("mod");
  const [cat, setCat] = useState("");
  const [hits, setHits] = useState<any[]>([]);
  const [sel, setSel] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  async function search() {
    if (config.featureFlags?.modrinth === false || config.modrinthEnabled === false) {
      setStatus("Modrinth ist per Feature-Flag deaktiviert.");
      return;
    }
    const facets = [[`project_type:${type}`]];
    if (cat) facets.push([`categories:${cat}`]);
    const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(q)}&limit=20&facets=${encodeURIComponent(
      JSON.stringify(facets)
    )}`;
    const res = await fetch(url);
    const data = await res.json();
    setHits(data.hits || []);
  }

  useEffect(() => {
    search();
  }, [type, cat]);

  async function openProject(id: string) {
    const p = await fetch(`https://api.modrinth.com/v2/project/${id}`).then((r) => r.json());
    const v = await fetch(`https://api.modrinth.com/v2/project/${id}/version`).then((r) => r.json());
    setSel(p);
    setVersions(v.slice(0, 8));
  }

  function install(project: any) {
    const inst = instances.find((i) => i.id === selectedInstanceId) || instances[0];
    if (project.project_type === "modpack") {
      setInstances([
        ...instances,
        {
          id: crypto.randomUUID(),
          name: project.title,
          version: "latest",
          loader: "Fabric",
          ramMb: 4096,
          playedMs: 0,
          icon: "pack",
          createdAt: Date.now(),
        },
      ]);
      setStatus(`Modpack „${project.title}“ als neue Instance angelegt.`);
    } else {
      setStatus(`„${project.title}“ in Instance „${inst?.name || "-"}“ /mods vorgemerkt (inkl. Dependencies wie Fabric API).`);
    }
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <h1 className="text-2xl font-semibold mb-4">Mods</h1>
      <div className="flex gap-2 mb-3">
        <input
          className="input"
          placeholder="Suche auf Modrinth…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button className="btn-primary px-4 rounded-lg" onClick={search}>
          Suchen
        </button>
      </div>
      <div className="flex gap-2 mb-2 flex-wrap">
        {TYPES.map((t) => (
          <button key={t.id} onClick={() => setType(t.id)} className={`btn ${type === t.id ? "ring-1 ring-cyan-400" : ""}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(cat === c ? "" : c)} className={`btn capitalize ${cat === c ? "ring-1 ring-indigo-400" : ""}`}>
            {c}
          </button>
        ))}
      </div>
      {status && <div className="text-sm text-cyan-400 mb-3">{status}</div>}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
        <div className="overflow-auto space-y-2 pr-1">
          {hits.map((h) => (
            <button key={h.project_id} onClick={() => openProject(h.slug || h.project_id)} className="card w-full p-3 text-left flex gap-3 hover:border-indigo-500">
              {h.icon_url && <img src={h.icon_url} className="w-12 h-12 rounded" alt="" />}
              <div>
                <div className="font-medium">{h.title}</div>
                <div className="text-xs text-zinc-500 line-clamp-2">{h.description}</div>
                <div className="text-[11px] text-zinc-500 mt-1">↓ {h.downloads?.toLocaleString?.()}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="card p-4 overflow-auto">
          {!sel && <div className="text-zinc-500 text-sm">Projekt auswählen…</div>}
          {sel && (
            <>
              <div className="text-lg font-semibold">{sel.title}</div>
              <p className="text-sm text-zinc-400 mt-2 whitespace-pre-wrap line-clamp-8">{sel.description}</p>
              <button className="btn-primary mt-4 px-4 py-2 rounded-lg" onClick={() => install(sel)}>
                Installieren
              </button>
              <div className="label mt-5">Versionen</div>
              {versions.map((v) => (
                <div key={v.id} className="text-xs py-1 border-b border-nexus-border flex justify-between">
                  <span>{v.name || v.version_number}</span>
                  <span className="text-zinc-500">{(v.loaders || []).join(", ")}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
