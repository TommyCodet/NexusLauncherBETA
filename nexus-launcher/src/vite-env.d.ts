/// <reference types="vite/client" />

export type NexusUser = {
  username: string;
  uuid: string;
  role: "admin" | "mod" | "user" | "beta";
  lastSeen?: number;
  banned?: boolean;
};

export type NexusInstance = {
  id: string;
  name: string;
  version: string;
  loader: "Vanilla" | "Fabric" | "Forge" | "NeoForge" | "Quilt";
  ramMb: number;
  playedMs: number;
  icon: string;
  createdAt: number;
  javaPath?: string;
};

declare global {
  interface Window {
    nexus: {
      getConfig: () => Promise<any>;
      saveConfig: (partial: any) => Promise<any>;
      registerUser: (payload: any) => Promise<any>;
      loginUser: (payload: any) => Promise<any>;
      listUsers: () => Promise<NexusUser[]>;
      updateUser: (payload: any) => Promise<any>;
      deleteUser: (username: string) => Promise<any>;
      getInstances: () => Promise<NexusInstance[]>;
      saveInstances: (instances: any) => Promise<any>;
      openFolder: (p: string) => Promise<string>;
      resolvePath: (p: string) => Promise<string>;
      detectJava: () => Promise<{ label: string; path: string; vendor: string }[]>;
      fetchVersions: () => Promise<{ id: string; type: string }[]>;
      openMicrosoftLogin: (url: string) => Promise<boolean>;
      msLoginAuto: () => Promise<any>;
      msExchange: (payload: any) => Promise<any>;
      msSession: () => Promise<any>;
      launch: (payload: any) => Promise<any>;
      onMcLog: (cb: (line: string) => void) => () => void;
      appendLog: (line: string) => Promise<boolean>;
      readLogs: () => Promise<string>;
      getStats: () => Promise<any>;
      incrementLaunch: () => Promise<any>;
      platform: string;
    };
  }
}
