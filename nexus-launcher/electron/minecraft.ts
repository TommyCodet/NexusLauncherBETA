import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import http from "http";
import { spawn } from "child_process";
import { shell } from "electron";

export type ProgressFn = (msg: string) => void;

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function sha1(buf: Buffer) {
  return crypto.createHash("sha1").update(buf).digest("hex");
}

export async function downloadFile(url: string, dest: string, expectedSha?: string) {
  ensureDir(path.dirname(dest));
  if (fs.existsSync(dest) && expectedSha) {
    const existing = fs.readFileSync(dest);
    if (sha1(existing) === expectedSha) return dest;
  } else if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    return dest;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download fehlgeschlagen ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (expectedSha && sha1(buf) !== expectedSha) throw new Error(`SHA1 mismatch: ${url}`);
  fs.writeFileSync(dest, buf);
  return dest;
}

export function currentOs(): "windows" | "osx" | "linux" {
  if (process.platform === "win32") return "windows";
  if (process.platform === "darwin") return "osx";
  return "linux";
}

export function rulesAllow(rules?: any[]) {
  if (!rules || !rules.length) return true;
  let allow = false;
  for (const r of rules) {
    const osOk = !r.os || !r.os.name || r.os.name === currentOs();
    if (osOk) allow = r.action === "allow";
  }
  return allow;
}

export async function exchangeMicrosoftCode(opts: {
  clientId: string;
  redirectUri: string;
  code: string;
}) {
  const body = new URLSearchParams({
    client_id: opts.clientId,
    code: opts.code,
    grant_type: "authorization_code",
    redirect_uri: opts.redirectUri,
    scope: "XboxLive.signin offline_access",
  });
  const tokenRes = await fetch("https://login.microsoftonline.com/consumers/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson: any = await tokenRes.json();
  if (!tokenJson.access_token) {
    throw new Error(tokenJson.error_description || tokenJson.error || "Microsoft Token fehlgeschlagen");
  }

  const xblRes = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      Properties: {
        AuthMethod: "RPS",
        SiteName: "user.auth.xboxlive.com",
        RpsTicket: "d=" + tokenJson.access_token,
      },
      RelyingParty: "http://auth.xboxlive.com",
      TokenType: "JWT",
    }),
  });
  const xbl: any = await xblRes.json();
  if (!xbl.Token) throw new Error("Xbox Live Auth fehlgeschlagen");
  const uhs = xbl.DisplayClaims?.xui?.[0]?.uhs;

  const xstsRes = await fetch("https://xsts.auth.xboxlive.com/xsts/authorize", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      Properties: { SandboxId: "RETAIL", UserTokens: [xbl.Token] },
      RelyingParty: "rp://api.minecraftservices.com/",
      TokenType: "JWT",
    }),
  });
  const xsts: any = await xstsRes.json();
  if (!xsts.Token) {
    if (xsts.XErr === 2148916233) throw new Error("Kein Xbox-Profil. xbox.com öffnen und Konto erstellen.");
    if (xsts.XErr === 2148916238) throw new Error("Konto ist in einem nicht erlaubten Land oder Kind-Konto.");
    throw new Error("XSTS fehlgeschlagen: " + (xsts.Message || xsts.XErr || "unbekannt"));
  }

  const mcRes = await fetch("https://api.minecraftservices.com/authentication/login_with_xbox", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identityToken: `XBL3.0 x=${uhs};${xsts.Token}` }),
  });
  const mc: any = await mcRes.json();
  if (!mc.access_token) throw new Error("Minecraft-Login fehlgeschlagen (besitzt der Account das Spiel?)");

  const profRes = await fetch("https://api.minecraftservices.com/minecraft/profile", {
    headers: { Authorization: `Bearer ${mc.access_token}` },
  });
  const prof: any = await profRes.json();
  if (!prof.id) throw new Error(prof.errorMessage || "Kein Minecraft-Profil. Java Edition muss gekauft sein.");

  return {
    name: prof.name,
    uuid: String(prof.id).replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5"),
    rawUuid: prof.id,
    accessToken: mc.access_token,
    refreshToken: tokenJson.refresh_token,
    skin: prof.skins?.[0]?.url || "",
  };
}

export async function startMsLoginWithLocalServer(clientId: string, preferredRedirect: string) {
  const port = 17890;
  const redirectUri =
    preferredRedirect === "http://localhost" || preferredRedirect === "http://localhost/"
      ? `http://localhost:${port}`
      : preferredRedirect;

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const u = new URL(req.url || "/", `http://localhost:${port}`);
        const c = u.searchParams.get("code");
        const err = u.searchParams.get("error");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        if (c) {
          res.end("<html><body style='background:#0a0a0f;color:#fff;font-family:sans-serif;padding:40px'>NEXUS: Login OK. Fenster schließen.</body></html>");
          resolve(c);
        } else {
          res.end(`<html><body>Fehler: ${err || "kein code"}</body></html>`);
          reject(new Error(err || "kein code"));
        }
      } catch (e) {
        reject(e);
      } finally {
        setTimeout(() => server.close(), 300);
      }
    });
    server.listen(port, "127.0.0.1", () => {
      const url =
        `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize` +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_mode=query` +
        `&scope=${encodeURIComponent("XboxLive.signin offline_access")}`;
      shell.openExternal(url);
    });
    setTimeout(() => {
      server.close();
      reject(new Error("Login-Timeout (3 Minuten)"));
    }, 180000);
  });

  return { code, redirectUri };
}

function libPath(mcRoot: string, name: string) {
  const [g, a, v] = name.split(":");
  const rel = path.join(...g.split("."), a, v, `${a}-${v}.jar`);
  return path.join(mcRoot, "libraries", rel);
}

function artifactPath(mcRoot: string, artifact: { path: string }) {
  return path.join(mcRoot, "libraries", artifact.path);
}

export async function prepareAndLaunch(opts: {
  mcRoot: string;
  instanceDir: string;
  versionId: string;
  ramMb: number;
  javaPath?: string;
  username: string;
  uuid: string;
  accessToken: string;
  onLog: ProgressFn;
}) {
  const { mcRoot, instanceDir, versionId, ramMb, onLog } = opts;
  ensureDir(mcRoot);
  ensureDir(instanceDir);
  ensureDir(path.join(instanceDir, "mods"));

  onLog("Lade Version-Manifest…");
  const manifest: any = await fetch("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json").then((r) => r.json());
  const found = manifest.versions.find((v: any) => v.id === versionId);
  if (!found) throw new Error("Version nicht gefunden: " + versionId);

  const versionDir = path.join(mcRoot, "versions", versionId);
  ensureDir(versionDir);
  const versionJsonPath = path.join(versionDir, `${versionId}.json`);
  onLog(`Lade ${versionId} JSON…`);
  await downloadFile(found.url, versionJsonPath, found.sha1);
  const version = JSON.parse(fs.readFileSync(versionJsonPath, "utf8"));

  const clientJar = path.join(versionDir, `${versionId}.jar`);
  onLog("Lade Client-JAR…");
  await downloadFile(version.downloads.client.url, clientJar, version.downloads.client.sha1);

  const nativesDir = path.join(versionDir, "natives");
  ensureDir(nativesDir);
  const classpath: string[] = [clientJar];
  const osName = currentOs();
  const classifierKey = osName === "windows" ? "natives-windows" : osName === "osx" ? "natives-macos" : "natives-linux";

  onLog("Lade Libraries…");
  for (const lib of version.libraries || []) {
    if (!rulesAllow(lib.rules)) continue;
    const artifact = lib.downloads?.artifact;
    if (artifact?.url) {
      const dest = artifact.path ? artifactPath(mcRoot, artifact) : libPath(mcRoot, lib.name);
      await downloadFile(artifact.url, dest, artifact.sha1);
      classpath.push(dest);
    }
    const natives = lib.natives?.[osName] || lib.downloads?.classifiers?.[classifierKey];
    const nativeArt =
      lib.downloads?.classifiers?.[lib.natives?.[osName]?.replace("${arch}", process.arch === "x64" ? "64" : "32")] ||
      lib.downloads?.classifiers?.[classifierKey] ||
      (typeof natives === "object" ? natives : null);
    if (nativeArt?.url) {
      const natJar = path.join(mcRoot, "libraries", nativeArt.path || `${lib.name}-natives.jar`);
      await downloadFile(nativeArt.url, natJar, nativeArt.sha1);
      await extractJarNatives(natJar, nativesDir);
    }
  }

  const assetsDir = path.join(mcRoot, "assets");
  const indexesDir = path.join(assetsDir, "indexes");
  const objectsDir = path.join(assetsDir, "objects");
  ensureDir(indexesDir);
  ensureDir(objectsDir);
  const assetIndexId = version.assetIndex.id;
  const indexPath = path.join(indexesDir, `${assetIndexId}.json`);
  onLog("Lade Asset-Index…");
  await downloadFile(version.assetIndex.url, indexPath, version.assetIndex.sha1);
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const objects = Object.values(index.objects || {}) as { hash: string; size: number }[];
  onLog(`Lade Assets (${objects.length})…`);
  let i = 0;
  for (const obj of objects) {
    i++;
    const sub = obj.hash.slice(0, 2);
    const dest = path.join(objectsDir, sub, obj.hash);
    if (!fs.existsSync(dest)) {
      await downloadFile(`https://resources.download.minecraft.net/${sub}/${obj.hash}`, dest, obj.hash);
    }
    if (i % 200 === 0) onLog(`Assets ${i}/${objects.length}`);
  }

  const java = opts.javaPath && fs.existsSync(opts.javaPath) ? opts.javaPath : await findJava();
  if (!java) throw new Error("Keine Java-Installation gefunden. Unter Settings Java suchen / Temurin 21 laden.");

  const cpSep = process.platform === "win32" ? ";" : ":";
  const mainClass = version.mainClass;
  const vars: Record<string, string> = {
    "${auth_player_name}": opts.username,
    "${version_name}": versionId,
    "${game_directory}": instanceDir,
    "${assets_root}": assetsDir,
    "${assets_index_name}": assetIndexId,
    "${auth_uuid}": opts.uuid.replace(/-/g, ""),
    "${auth_access_token}": opts.accessToken,
    "${clientid}": "nexus",
    "${auth_xuid}": "0",
    "${user_type}": "msa",
    "${version_type}": version.type || "release",
    "${natives_directory}": nativesDir,
    "${launcher_name}": "NEXUS",
    "${launcher_version}": "1.0.0",
    "${classpath}": classpath.join(cpSep),
    "${user_properties}": "{}",
  };

  const jvmArgs = ["-Xmx" + ramMb + "M", "-Xms512M", `-Djava.library.path=${nativesDir}`];
  if (version.arguments?.jvm) {
    for (const a of version.arguments.jvm) {
      if (typeof a === "string") jvmArgs.push(replaceVars(a, vars));
      else if (a && rulesAllow(a.rules)) {
        const val = a.value;
        if (Array.isArray(val)) val.forEach((x: string) => jvmArgs.push(replaceVars(x, vars)));
        else if (typeof val === "string") jvmArgs.push(replaceVars(val, vars));
      }
    }
  }

  const gameArgs: string[] = [];
  if (version.arguments?.game) {
    for (const a of version.arguments.game) {
      if (typeof a === "string") gameArgs.push(replaceVars(a, vars));
      else if (a && rulesAllow(a.rules)) {
        const val = a.value;
        if (Array.isArray(val)) val.forEach((x: string) => gameArgs.push(replaceVars(x, vars)));
        else if (typeof val === "string") gameArgs.push(replaceVars(val, vars));
      }
    }
  } else if (version.minecraftArguments) {
    gameArgs.push(...replaceVars(version.minecraftArguments, vars).split(" "));
  }

  const args = [...jvmArgs.filter((x) => !x.startsWith("-cp") && x !== "${classpath}"), "-cp", classpath.join(cpSep), mainClass, ...gameArgs];
  onLog(`Starte Java: ${java}`);
  const child = spawn(java, args, { cwd: instanceDir, env: process.env });
  child.stdout?.on("data", (d) => onLog(String(d).trimEnd()));
  child.stderr?.on("data", (d) => onLog(String(d).trimEnd()));
  child.on("exit", (code) => onLog(`Minecraft beendet (code ${code})`));
  return child.pid;
}

function replaceVars(s: string, vars: Record<string, string>) {
  let out = s;
  for (const [k, v] of Object.entries(vars)) out = out.split(k).join(v);
  return out;
}

async function extractJarNatives(jar: string, dest: string) {
  // ZIP extract without extra deps
  const buf = fs.readFileSync(jar);
  // Use unzip via system if available, else minimal unzip
  await new Promise<void>((resolve, reject) => {
    const unzip = process.platform === "win32" ? "tar" : "unzip";
    if (process.platform === "win32") {
      const p = spawn("tar", ["-xf", jar, "-C", dest], { windowsHide: true });
      p.on("exit", () => resolve());
      p.on("error", () => resolve());
    } else {
      const p = spawn("unzip", ["-o", "-q", jar, "-d", dest]);
      p.on("exit", () => resolve());
      p.on("error", () => {
        try {
          extractZipMinimal(buf, dest);
        } catch {}
        resolve();
      });
    }
  });
}

function extractZipMinimal(buf: Buffer, dest: string) {
  // very small local-file unzip for natives
  let i = 0;
  while (i < buf.length - 4) {
    if (buf.readUInt32LE(i) !== 0x04034b50) {
      i++;
      continue;
    }
    const method = buf.readUInt16LE(i + 8);
    const comp = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const name = buf.slice(i + 30, i + 30 + nameLen).toString("utf8");
    const start = i + 30 + nameLen + extraLen;
    if (name.endsWith("/") || name.includes("META-INF")) {
      i = start + comp;
      continue;
    }
    const data = buf.slice(start, start + comp);
    const out = path.join(dest, name);
    ensureDir(path.dirname(out));
    if (method === 0) fs.writeFileSync(out, data);
    i = start + comp;
  }
}

export async function findJava() {
  const exe = process.platform === "win32" ? "java.exe" : "java";
  const home = process.env.JAVA_HOME;
  if (home && fs.existsSync(path.join(home, "bin", exe))) return path.join(home, "bin", exe);
  const guesses =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Eclipse Adoptium",
          "C:\\Program Files\\Java",
          "C:\\Program Files\\Microsoft",
          path.join(process.env.LOCALAPPDATA || "", "Programs", "Eclipse Adoptium"),
        ]
      : ["/usr/lib/jvm", "/usr/bin"];
  for (const root of guesses) {
    if (root.endsWith("java") && fs.existsSync(root)) return root;
    if (!fs.existsSync(root)) continue;
    const walk = (dir: string, depth: number): string | null => {
      if (depth > 4) return null;
      let entries: string[] = [];
      try {
        entries = fs.readdirSync(dir);
      } catch {
        return null;
      }
      for (const e of entries) {
        const p = path.join(dir, e);
        if (e === exe) return p;
        try {
          if (fs.statSync(p).isDirectory()) {
            const f = walk(p, depth + 1);
            if (f) return f;
          }
        } catch {}
      }
      return null;
    };
    const f = walk(root, 0);
    if (f) return f;
  }
  return null;
}
