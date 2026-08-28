import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { spawn } from "child_process";
import {
  exchangeMicrosoftCode,
  startMsLoginWithLocalServer,
  prepareAndLaunch,
} from "./minecraft";

const isDev = !app.isPackaged;

function userDataFile(name: string) {
  const dir = path.join(app.getPath("userData"));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, name);
}

function defaultConfig() {
  return {
    clientId: "21737e37-48e2-4792-a681-72a6104b6dc7",
    redirectUri: "http://localhost",
    launcherPasswordHash: "",
    users: [] as any[],
    roles: {},
    theme: "Dark (NEXUS)",
    language: "Deutsch",
    ramMb: 2048,
    javaPath: "",
    minecraftPath: process.platform === "win32" ? "%APPDATA%/.minecraft" : path.join(os.homedir(), ".minecraft"),
    adminPanelEnabled: true,
    modrinthEnabled: true,
    friendsChatEnabled: true,
    autoUpdaterEnabled: true,
    announcement: "",
    featureFlags: { modrinth: true, friendsChat: true, autoUpdater: true },
    closeAfterLaunch: false,
    keepLauncherOpen: true,
    autoUpdaterOnStart: true,
  };
}

function readJson(file: string, fallback: any) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {}
  return fallback;
}

function writeJson(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function configPath() {
  const packaged = userDataFile("config.json");
  const local = path.join(process.cwd(), "config.json");
  if (fs.existsSync(packaged)) return packaged;
  if (fs.existsSync(local)) {
    try {
      fs.copyFileSync(local, packaged);
    } catch {}
    return packaged;
  }
  writeJson(packaged, defaultConfig());
  return packaged;
}

function getConfig() {
  return { ...defaultConfig(), ...readJson(configPath(), {}) };
}

function saveConfig(partial: any) {
  const next = { ...getConfig(), ...partial };
  writeJson(configPath(), next);
  const cwdCopy = path.join(process.cwd(), "config.json");
  try {
    writeJson(cwdCopy, next);
  } catch {}
  return next;
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  if (!stored) return false;
  if (stored.startsWith("scrypt:")) {
    const [, salt, hash] = stored.split(":");
    const check = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(check, "hex"));
  }
  return false;
}

function instancesPath() {
  return userDataFile("instances.json");
}

function logsPath() {
  return userDataFile("launcher.log");
}

function statsPath() {
  return userDataFile("stats.json");
}

function resolveEnvPath(p: string) {
  if (!p) return p;
  let out = p
    .replace(/%APPDATA%/gi, process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"))
    .replace(/%LOCALAPPDATA%/gi, process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"))
    .replace(/^~/, os.homedir());
  return out;
}

function detectJavaInstalls() {
  const found: { label: string; path: string; vendor: string }[] = [];
  const home = os.homedir();
  const candidates: string[] = [];

  if (process.env.JAVA_HOME) {
    candidates.push(path.join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "java.exe" : "java"));
  }

  const winRoots = [
    "C:\\Program Files\\Eclipse Adoptium",
    "C:\\Program Files\\Java",
    "C:\\Program Files\\Microsoft",
    "C:\\Program Files\\Zulu",
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Eclipse Adoptium"),
  ];
  const unixRoots = [
    "/usr/lib/jvm",
    "/usr/lib64/jvm",
    "/Library/Java/JavaVirtualMachines",
    path.join(home, ".sdkman/candidates/java"),
  ];

  const roots = process.platform === "win32" ? winRoots : unixRoots;
  for (const root of roots) {
    if (!root || !fs.existsSync(root)) continue;
    try {
      const entries = fs.readdirSync(root);
      for (const e of entries) {
        const exe =
          process.platform === "win32"
            ? path.join(root, e, "bin", "java.exe")
            : fs.existsSync(path.join(root, e, "Contents", "Home", "bin", "java"))
            ? path.join(root, e, "Contents", "Home", "bin", "java")
            : path.join(root, e, "bin", "java");
        if (fs.existsSync(exe)) candidates.push(exe);
      }
    } catch {}
  }

  const unique = [...new Set(candidates)];
  for (const p of unique) {
    const name = p.toLowerCase();
    let ver = "Java";
    if (name.includes("25")) ver = "Java 25";
    else if (name.includes("21")) ver = "Java 21";
    else if (name.includes("17")) ver = "Java 17";
    else if (name.includes("11")) ver = "Java 11";
    else if (name.includes("1.8") || name.includes("8")) ver = "Java 8";
    const vendor = name.includes("temurin") || name.includes("adoptium") ? "Temurin" : "JDK";
    found.push({ label: `${ver} · ${vendor}`, path: p, vendor });
  }
  return found;
}

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 680,
    backgroundColor: "#0a0a0f",
    title: "NEXUS",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  if (!fs.existsSync(instancesPath())) {
    writeJson(instancesPath(), [
      {
        id: "survival",
        name: "Survival World",
        version: "1.20.4",
        loader: "Vanilla",
        ramMb: 2048,
        playedMs: 0,
        icon: "grass",
        createdAt: Date.now(),
      },
      {
        id: "fabric",
        name: "Fabric Modpack",
        version: "1.20.1",
        loader: "Fabric",
        ramMb: 3072,
        playedMs: 0,
        icon: "sword",
        createdAt: Date.now(),
      },
      {
        id: "tech",
        name: "Tech Adventure",
        version: "1.19.2",
        loader: "Forge",
        ramMb: 2560,
        playedMs: 0,
        icon: "gear",
        createdAt: Date.now(),
      },
      {
        id: "test",
        name: "Test Instance",
        version: "1.21",
        loader: "Vanilla",
        ramMb: 1536,
        playedMs: 0,
        icon: "crystal",
        createdAt: Date.now(),
      },
    ]);
  }
  if (!fs.existsSync(statsPath())) writeJson(statsPath(), { launches: 0, lastLaunch: 0 });
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("config:get", () => getConfig());
ipcMain.handle("config:save", (_e, partial) => saveConfig(partial));

ipcMain.handle("auth:register", (_e, { username, password }) => {
  const cfg = getConfig();
  if (!username || !password) return { ok: false, error: "Benutzername und Passwort erforderlich" };
  if (cfg.users.some((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
    return { ok: false, error: "Benutzer existiert bereits" };
  }
  const user = {
    username,
    uuid: crypto.randomUUID(),
    role: cfg.users.length === 0 ? "admin" : "user",
    passwordHash: hashPassword(password),
    lastSeen: Date.now(),
    banned: false,
  };
  cfg.users.push(user);
  cfg.launcherPasswordHash = user.passwordHash;
  saveConfig(cfg);
  const safe = { username: user.username, uuid: user.uuid, role: user.role };
  return { ok: true, user: safe };
});

ipcMain.handle("auth:login", (_e, { username, password }) => {
  const cfg = getConfig();
  const user = cfg.users.find((u: any) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user) return { ok: false, error: "Benutzer nicht gefunden" };
  if (user.banned) return { ok: false, error: "Benutzer gesperrt" };
  if (!verifyPassword(password, user.passwordHash)) return { ok: false, error: "Falsches Passwort" };
  user.lastSeen = Date.now();
  saveConfig(cfg);
  return { ok: true, user: { username: user.username, uuid: user.uuid, role: user.role } };
});

ipcMain.handle("users:list", () => {
  const cfg = getConfig();
  return cfg.users.map((u: any) => ({
    username: u.username,
    uuid: u.uuid,
    role: u.role,
    lastSeen: u.lastSeen,
    banned: !!u.banned,
  }));
});

ipcMain.handle("users:update", (_e, payload) => {
  const cfg = getConfig();
  const user = cfg.users.find((u: any) => u.username === payload.username);
  if (!user) return { ok: false };
  if (payload.role) user.role = payload.role;
  if (typeof payload.banned === "boolean") user.banned = payload.banned;
  saveConfig(cfg);
  return { ok: true };
});

ipcMain.handle("users:delete", (_e, username) => {
  const cfg = getConfig();
  cfg.users = cfg.users.filter((u: any) => u.username !== username);
  saveConfig(cfg);
  return { ok: true };
});

ipcMain.handle("instances:list", () => readJson(instancesPath(), []));
ipcMain.handle("instances:save", (_e, instances) => {
  writeJson(instancesPath(), instances);
  return instances;
});

ipcMain.handle("fs:openFolder", async (_e, p) => {
  const resolved = resolveEnvPath(p);
  if (!fs.existsSync(resolved)) fs.mkdirSync(resolved, { recursive: true });
  await shell.openPath(resolved);
  return resolved;
});

ipcMain.handle("fs:resolvePath", (_e, p) => resolveEnvPath(p));
ipcMain.handle("java:detect", () => detectJavaInstalls());

ipcMain.handle("mc:versions", async () => {
  try {
    const res = await fetch("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json");
    const data = await res.json();
    return data.versions?.slice(0, 80) || [];
  } catch {
    return [
      { id: "1.21.4", type: "release" },
      { id: "1.21", type: "release" },
      { id: "1.20.4", type: "release" },
      { id: "1.20.1", type: "release" },
      { id: "1.19.2", type: "release" },
    ];
  }
});

ipcMain.handle("auth:openMs", async (_e, url: string) => {
  await shell.openExternal(url);
  return true;
});

function sessionPath() {
  return userDataFile("ms-session.json");
}

ipcMain.handle("auth:msLoginAuto", async () => {
  const cfg = getConfig();
  const { code, redirectUri } = await startMsLoginWithLocalServer(cfg.clientId, cfg.redirectUri || "http://localhost");
  const profile = await exchangeMicrosoftCode({ clientId: cfg.clientId, redirectUri, code });
  writeJson(sessionPath(), profile);
  return { ok: true, profile: { name: profile.name, uuid: profile.uuid, skin: profile.skin } };
});

ipcMain.handle("auth:msExchange", async (_e, payload: { code: string; redirectUri?: string }) => {
  const cfg = getConfig();
  const redirectUri = payload.redirectUri || cfg.redirectUri || "http://localhost";
  try {
    const profile = await exchangeMicrosoftCode({
      clientId: cfg.clientId,
      redirectUri,
      code: String(payload.code || "").trim(),
    });
    writeJson(sessionPath(), profile);
    return { ok: true, profile: { name: profile.name, uuid: profile.uuid, skin: profile.skin } };
  } catch (e: any) {
    return { ok: false, error: e.message || String(e) };
  }
});

ipcMain.handle("auth:msSession", () => {
  const s = readJson(sessionPath(), null);
  if (!s) return null;
  return { name: s.name, uuid: s.uuid, skin: s.skin };
});

ipcMain.handle("mc:launch", async (_e, payload: any) => {
  const cfg = getConfig();
  const session = readJson(sessionPath(), null);
  const mcRoot = resolveEnvPath(cfg.minecraftPath || "%APPDATA%/.minecraft");
  const instName = (payload?.name || "instance").replace(/[^\w\- ]+/g, "_");
  const instanceDir = path.join(mcRoot, "nexus-instances", instName);
  const versionId = payload?.version || "1.20.4";
  const ramMb = Number(payload?.ramMb || cfg.ramMb || 2048);
  const javaPath = payload?.javaPath || cfg.javaPath || "";
  const send = (line: string) => {
    try {
      fs.appendFileSync(logsPath(), line + "\n");
    } catch {}
    win?.webContents.send("mc:log", line);
  };
  try {
    send(`[NEXUS] Starte ${instName} ${versionId}…`);
    const pid = await prepareAndLaunch({
      mcRoot,
      instanceDir,
      versionId,
      ramMb,
      javaPath,
      username: session?.name || payload?.username || "Player",
      uuid: session?.uuid || "00000000-0000-0000-0000-000000000000",
      accessToken: session?.accessToken || "0",
      onLog: send,
    });
    const st = readJson(statsPath(), { launches: 0 });
    st.launches = (st.launches || 0) + 1;
    st.lastLaunch = Date.now();
    writeJson(statsPath(), st);
    if (cfg.closeAfterLaunch && win) win.hide();
    return { ok: true, pid };
  } catch (e: any) {
    send("[NEXUS] Fehler: " + (e.message || e));
    return { ok: false, error: e.message || String(e) };
  }
});

ipcMain.handle("logs:append", (_e, line: string) => {
  fs.appendFileSync(logsPath(), line + "\n");
  return true;
});

ipcMain.handle("logs:read", () => {
  if (!fs.existsSync(logsPath())) return "";
  return fs.readFileSync(logsPath(), "utf8");
});

ipcMain.handle("stats:get", () => readJson(statsPath(), { launches: 0 }));
ipcMain.handle("stats:launch", () => {
  const s = readJson(statsPath(), { launches: 0 });
  s.launches = (s.launches || 0) + 1;
  s.lastLaunch = Date.now();
  writeJson(statsPath(), s);
  return s;
});

export {};
