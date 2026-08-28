import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("nexus", {
  getConfig: () => ipcRenderer.invoke("config:get"),
  saveConfig: (partial: unknown) => ipcRenderer.invoke("config:save", partial),
  registerUser: (payload: unknown) => ipcRenderer.invoke("auth:register", payload),
  loginUser: (payload: unknown) => ipcRenderer.invoke("auth:login", payload),
  listUsers: () => ipcRenderer.invoke("users:list"),
  updateUser: (payload: unknown) => ipcRenderer.invoke("users:update", payload),
  deleteUser: (username: string) => ipcRenderer.invoke("users:delete", username),
  getInstances: () => ipcRenderer.invoke("instances:list"),
  saveInstances: (instances: unknown) => ipcRenderer.invoke("instances:save", instances),
  openFolder: (p: string) => ipcRenderer.invoke("fs:openFolder", p),
  resolvePath: (p: string) => ipcRenderer.invoke("fs:resolvePath", p),
  detectJava: () => ipcRenderer.invoke("java:detect"),
  fetchVersions: () => ipcRenderer.invoke("mc:versions"),
  openMicrosoftLogin: (url: string) => ipcRenderer.invoke("auth:openMs", url),
  msLoginAuto: () => ipcRenderer.invoke("auth:msLoginAuto"),
  msExchange: (payload: unknown) => ipcRenderer.invoke("auth:msExchange", payload),
  msSession: () => ipcRenderer.invoke("auth:msSession"),
  launch: (payload: unknown) => ipcRenderer.invoke("mc:launch", payload),
  onMcLog: (cb: (line: string) => void) => {
    const fn = (_: unknown, line: string) => cb(line);
    ipcRenderer.on("mc:log", fn);
    return () => ipcRenderer.removeListener("mc:log", fn);
  },
  appendLog: (line: string) => ipcRenderer.invoke("logs:append", line),
  readLogs: () => ipcRenderer.invoke("logs:read"),
  getStats: () => ipcRenderer.invoke("stats:get"),
  incrementLaunch: () => ipcRenderer.invoke("stats:launch"),
  platform: process.platform,
});
