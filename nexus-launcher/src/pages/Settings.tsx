import { useEffect, useState } from "react";
import { useApp } from "../store/AppState";

export default function Settings() {
  const { config, setConfig } = useApp();
  const [resolved, setResolved] = useState("");
  const [javas, setJavas] = useState<{ label: string; path: string }[]>([]);
  const [ram, setRam] = useState(config.ramMb || 2048);
  const [mcPath, setMcPath] = useState(config.minecraftPath || "%APPDATA%/.minecraft");
  const [lang, setLang] = useState(config.language || "Deutsch");
  const [theme, setTheme] = useState(config.theme || "Dark (NEXUS)");
  const [javaPath, setJavaPath] = useState(config.javaPath || "");
  const [autoUp, setAutoUp] = useState(config.autoUpdaterOnStart !== false);
  const [closeAfter, setCloseAfter] = useState(!!config.closeAfterLaunch);
  const [keepOpen, setKeepOpen] = useState(config.keepLauncherOpen !== false);

  useEffect(() => {
    (async () => {
      if (!window.nexus) {
        setResolved("C:\\Users\\alexk\\AppData\\Roaming\\.minecraft");
        return;
      }
      setResolved(await window.nexus.resolvePath(mcPath));
    })();
  }, [mcPath]);

  async function saveDir() {
    const next = await (window.nexus
      ? window.nexus.saveConfig({ minecraftPath: mcPath, language: lang, theme, ramMb: ram, javaPath })
      : { ...config, minecraftPath: mcPath, language: lang, theme, ramMb: ram, javaPath });
    setConfig(next);
  }

  async function findJava() {
    if (!window.nexus) {
      setJavas([
        { label: "Java 25 25.0.4 · Temurin", path: "C:\\Users\\alexk\\AppData\\Local\\Programs\\Eclipse Adoptium\\jdk-25.0.4.7-hotspot\\bin\\java.exe" },
        { label: "Java 21 21.0.11 · Temurin", path: "C:\\Program Files\\Eclipse Adoptium\\jre-21.0.11.10-hotspot\\bin\\java.exe" },
      ]);
      return;
    }
    setJavas(await window.nexus.detectJava());
  }

  function downloadTemurin(ver: string) {
    const urls: Record<string, string> = {
      "8": "https://adoptium.net/temurin/releases/?version=8",
      "17": "https://adoptium.net/temurin/releases/?version=17",
      "21": "https://adoptium.net/temurin/releases/?version=21",
    };
    window.open(urls[ver], "_blank");
  }

  async function persistLauncher() {
    const next = window.nexus
      ? await window.nexus.saveConfig({ autoUpdaterOnStart: autoUp, closeAfterLaunch: closeAfter, keepLauncherOpen: keepOpen, ramMb: ram, javaPath })
      : { ...config, autoUpdaterOnStart: autoUp, closeAfterLaunch: closeAfter, keepLauncherOpen: keepOpen };
    setConfig(next);
  }

  return (
    <div className="p-8 max-w-3xl space-y-4">
      <div className="label">EINSTELLUNGEN</div>

      <section className="card p-5 space-y-3">
        <div className="label">GENERAL</div>
        <div className="label">MINECRAFT-VERZEICHNIS</div>
        <input className="input" value={mcPath} onChange={(e) => setMcPath(e.target.value)} />
        <div className="text-xs text-zinc-500">Aufgelöst: {resolved}</div>
        <div className="label">SPRACHE</div>
        <select className="input" value={lang} onChange={(e) => setLang(e.target.value)}>
          <option>Deutsch</option>
          <option>English</option>
        </select>
        <div className="label">THEME</div>
        <select className="input" value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option>Dark (NEXUS)</option>
          <option>Dark (Prism)</option>
        </select>
        <button className="btn-primary px-4 py-2 rounded-lg" onClick={saveDir}>
          Verzeichnis speichern
        </button>
      </section>

      <section className="card p-5 space-y-3">
        <div className="label">JAVA & RAM</div>
        <div className="text-xs text-zinc-400">GLOBALER RAM: {ram} MB</div>
        <input type="range" min={512} max={16384} step={256} value={ram} onChange={(e) => setRam(Number(e.target.value))} className="w-full accent-violet-500" />
        <div className="label">JAVA-PFAD (OPTIONAL, LEER = AUTO)</div>
        <input className="input" placeholder="Auto-Detect / Managed" value={javaPath} onChange={(e) => setJavaPath(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={findJava}>
            Java suchen
          </button>
          <button className="btn" onClick={() => downloadTemurin("8")}>
            Temurin 8 laden
          </button>
          <button className="btn" onClick={() => downloadTemurin("17")}>
            Temurin 17 laden
          </button>
          <button className="btn" onClick={() => downloadTemurin("21")}>
            Temurin 21 laden
          </button>
        </div>
        <div className="label mt-2">GEFUNDENE INSTALLATIONEN</div>
        <div className="space-y-2">
          {javas.map((j) => (
            <button key={j.path} className="card w-full p-3 text-left text-sm" onClick={() => setJavaPath(j.path)}>
              <div className="font-medium">{j.label}</div>
              <div className="text-xs text-zinc-500 font-mono break-all">{j.path}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5 space-y-2">
        <div className="label">LAUNCHER</div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={autoUp} onChange={(e) => setAutoUp(e.target.checked)} /> Auto-Updater beim Start
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={closeAfter} onChange={(e) => setCloseAfter(e.target.checked)} /> Launcher nach Spielstart schließen
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={keepOpen} onChange={(e) => setKeepOpen(e.target.checked)} /> Launcher offen halten
        </label>
        <button className="btn mt-2" onClick={persistLauncher}>
          Speichern
        </button>
      </section>
    </div>
  );
}
