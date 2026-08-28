import { useEffect, useState } from "react";
import { useApp } from "../store/AppState";

export default function Play() {
  const { config, instances, selectedInstanceId, setMsAccount, msAccount } = useApp();
  const inst = instances.find((i) => i.id === selectedInstanceId) || instances[0];
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("Mit Microsoft anmelden, dann Play. Erster Start lädt Version + Assets (einmalig, dauert).");
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!window.nexus?.onMcLog) return;
    return window.nexus.onMcLog((line) => {
      setLines((p) => [...p.slice(-80), line]);
      setStatus(line);
    });
  }, []);

  useEffect(() => {
    (async () => {
      if (!window.nexus?.msSession) return;
      const s = await window.nexus.msSession();
      if (s) setMsAccount(s);
    })();
  }, []);

  async function startMsLogin() {
    setBusy(true);
    setStatus("Browser öffnet sich… nach Login kommt der Code automatisch (Port 17890).");
    try {
      if (window.nexus?.msLoginAuto) {
        const res = await window.nexus.msLoginAuto();
        if (res.ok) {
          setMsAccount(res.profile);
          setStatus(`Angemeldet als ${res.profile.name}`);
        } else setStatus(res.error || "Login fehlgeschlagen");
      } else {
        const clientId = config.clientId;
        const redirect = encodeURIComponent(config.redirectUri || "http://localhost");
        const url = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirect}&response_mode=query&scope=${encodeURIComponent(
          "XboxLive.signin offline_access"
        )}`;
        window.open(url, "_blank");
      }
    } catch (e: any) {
      setStatus(e.message || String(e));
    }
    setBusy(false);
  }

  async function finishAuth() {
    if (!code.trim()) {
      setStatus("Bitte Auth-Code einfügen (oder Auto-Login nutzen).");
      return;
    }
    setBusy(true);
    try {
      const res = await window.nexus.msExchange({ code: code.trim(), redirectUri: config.redirectUri || "http://localhost" });
      if (!res.ok) setStatus(res.error || "Token-Tausch fehlgeschlagen");
      else {
        setMsAccount(res.profile);
        setStatus(`Angemeldet als ${res.profile.name}`);
      }
    } catch (e: any) {
      setStatus(e.message || String(e));
    }
    setBusy(false);
  }

  async function loadVersions() {
    setBusy(true);
    const v = window.nexus ? await window.nexus.fetchVersions() : [];
    setStatus(`Versionen geladen: ${v.length || 0}`);
    setBusy(false);
  }

  async function checkJava() {
    setBusy(true);
    const found = window.nexus ? await window.nexus.detectJava() : [];
    setStatus(found.length ? `Java gefunden: ${found.map((f) => f.label).join(", ")}` : "Keine Java-Installation gefunden.");
    setBusy(false);
  }

  async function launch() {
    if (!inst) {
      setStatus("Keine Instance ausgewählt.");
      return;
    }
    if (inst.loader !== "Vanilla") {
      setStatus(`Hinweis: ${inst.loader} wird noch als Vanilla-Version ${inst.version} gestartet (Loader-Installer folgt).`);
    }
    setBusy(true);
    setLines([]);
    setStatus("Bereite Start vor (Downloads können mehrere Minuten dauern)…");
    const res = await window.nexus.launch({
      name: inst.name,
      version: inst.version,
      ramMb: inst.ramMb,
      javaPath: inst.javaPath || config.javaPath,
      username: msAccount?.name,
    });
    setStatus(res.ok ? `Minecraft läuft (PID ${res.pid})` : "Fehler: " + res.error);
    setBusy(false);
  }

  return (
    <div className="p-8 max-w-3xl space-y-4">
      <div className="label">PLAY</div>
      {inst && (
        <div className="text-sm text-zinc-400">
          Ausgewählt: <span className="text-white">{inst.name}</span> · {inst.version} · {inst.loader}
        </div>
      )}

      <section className="card p-5">
        <div className="label">KONFIGURATION</div>
        <div className="label mt-3">CLIENT ID</div>
        <input className="input font-mono text-cyan-300" readOnly value={config.clientId || ""} />
        <div className="label mt-3">REDIRECT URI</div>
        <input className="input font-mono text-cyan-300" readOnly value={config.redirectUri || "http://localhost"} />
      </section>

      <section className="card p-5">
        <div className="label">MICROSOFT ACCOUNT</div>
        {msAccount && (
          <div className="mb-3 text-sm text-emerald-400">
            Angemeldet: {msAccount.name} ({String(msAccount.uuid || "").slice(0, 8)}…)
          </div>
        )}
        <button
          onClick={startMsLogin}
          disabled={busy}
          className="w-full py-2.5 rounded-lg bg-[#2a2a32] border border-nexus-border flex items-center justify-center gap-2 text-sm"
        >
          <span className="inline-block w-4 h-4 bg-gradient-to-br from-red-500 via-green-500 to-blue-500" />
          Mit Microsoft anmelden
        </button>
        <div className="label mt-4">Auth-Code aus Redirect-URL (?code=…) — Fallback</div>
        <input className="input" placeholder="Code hier einfügen" value={code} onChange={(e) => setCode(e.target.value)} />
        <button onClick={finishAuth} disabled={busy} className="btn-primary w-full mt-3 py-2.5 rounded-lg">
          Authentifizierung abschließen
        </button>
      </section>

      <section className="card p-5">
        <div className="label">MINECRAFT</div>
        <div className="flex gap-2 mt-2 flex-wrap">
          <button className="btn" onClick={loadVersions}>
            Versionen laden
          </button>
          <button className="btn" onClick={checkJava}>
            Java prüfen
          </button>
          <button className="btn-primary px-4 py-2 rounded-lg" disabled={busy} onClick={launch}>
            ▶ Spiel starten
          </button>
        </div>
      </section>

      <section className="card p-5">
        <div className="label">AUTO-UPDATER</div>
        <div className="text-sm text-zinc-400 mt-1">
          Update-Check: {config.featureFlags?.autoUpdater === false ? "deaktiviert" : "Offline / nicht konfiguriert"}
        </div>
        <button className="btn mt-3">Nach Update suchen</button>
      </section>

      <div className="card px-4 py-3 text-sm text-cyan-400 whitespace-pre-wrap">{status}</div>
      {lines.length > 0 && (
        <pre className="card p-3 font-mono text-[11px] max-h-48 overflow-auto text-zinc-300">{lines.join("\n")}</pre>
      )}
    </div>
  );
}
