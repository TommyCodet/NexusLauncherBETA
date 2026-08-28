import { useEffect, useMemo, useState } from "react";

const SAMPLE = `[23:07:19] [Server thread/INFO]: Changing view distance to 32, from 10
[23:07:19] [Render thread/INFO]: Loaded 5 advancements
[23:07:19] [Server thread/INFO]: Changing simulation distance to 32, from 0
[23:07:20] [Render thread/INFO]: Resizing Dynamic Transforms UBO
[23:07:39] [Render thread/INFO]: OpenGL debug message: id=1280, source=API, type=ERROR, severity=HIGH, message='GL_INVALID_ENUM error generated.'
[23:08:14] [System] [CHAT] Game_zocker hat das Ziel [Hinterm Horizont geht's weiter] erreicht
[23:08:28] [System] [CHAT] Dein Spielmodus wurde auf Überlebensmodus gesetzt
[23:17:49] [Server thread/INFO]: Stopping server
[23:17:57] [Render thread/INFO]: Stopping!`;

export default function Logs() {
  const [raw, setRaw] = useState(SAMPLE);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("ALL");

  useEffect(() => {
    (async () => {
      if (!window.nexus) return;
      const stored = await window.nexus.readLogs();
      if (stored) setRaw(stored + "\n" + SAMPLE);
    })();
  }, []);

  const lines = useMemo(() => {
    return raw.split("\n").filter((l) => {
      if (q && !l.toLowerCase().includes(q.toLowerCase())) return false;
      if (level === "ERROR") return /error|warn/i.test(l);
      if (level === "WARN") return /warn/i.test(l);
      if (level === "INFO") return /info/i.test(l);
      return true;
    });
  }, [raw, q, level]);

  function exportLogs() {
    const blob = new Blob([raw], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "nexus-logs.txt";
    a.click();
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <h1 className="text-xl font-semibold mr-auto">LOGS</h1>
        <input className="input max-w-xs" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
        {["ALL", "INFO", "WARN", "ERROR"].map((l) => (
          <button key={l} className={`btn ${level === l ? "ring-1 ring-cyan-400" : ""}`} onClick={() => setLevel(l)}>
            {l}
          </button>
        ))}
        <button className="btn" onClick={exportLogs}>
          Export
        </button>
      </div>
      <div className="text-xs text-zinc-500 mb-2">Geladen: {raw.length} Zeichen</div>
      <pre className="flex-1 overflow-auto card p-4 font-mono text-[12px] leading-5">
        {lines.map((l, i) => (
          <div key={i} className={/ERROR|INVALID/i.test(l) ? "bg-red-900/40 text-red-200" : "text-zinc-300"}>
            {l}
          </div>
        ))}
      </pre>
    </div>
  );
}
