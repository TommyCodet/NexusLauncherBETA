import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { NexusInstance, NexusUser } from "../vite-env";

type Friend = {
  id: string;
  username: string;
  online: boolean;
  instance?: string;
  avatar: string;
};

type ChatMsg = { from: string; text: string; at: number };

type Ctx = {
  config: any;
  setConfig: (c: any) => void;
  refreshConfig: () => Promise<void>;
  user: NexusUser | null;
  setUser: (u: NexusUser | null) => void;
  instances: NexusInstance[];
  setInstances: (i: NexusInstance[]) => void;
  selectedInstanceId: string | null;
  setSelectedInstanceId: (id: string | null) => void;
  msAccount: { name: string; uuid: string; skin: string } | null;
  setMsAccount: (a: any) => void;
  friends: Friend[];
  setFriends: (f: Friend[]) => void;
  chats: Record<string, ChatMsg[]>;
  addMessage: (friendId: string, msg: ChatMsg) => void;
  requests: Friend[];
  setRequests: (r: Friend[]) => void;
  announcement: string;
  setAnnouncement: (s: string) => void;
  onlineCount: number;
};

const AppCtx = createContext<Ctx>(null as any);

const DEMO_FRIENDS: Friend[] = [
  { id: "1", username: "AlexCraft", online: true, instance: "Survival World", avatar: "A" },
  { id: "2", username: "SteveMiner", online: true, instance: "Fabric Modpack", avatar: "S" },
  { id: "3", username: "EnderFox", online: false, avatar: "E" },
  { id: "4", username: "RedstoneDev", online: true, instance: "Tech Adventure", avatar: "R" },
];

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<any>({});
  const [user, setUser] = useState<NexusUser | null>(null);
  const [instances, setInstances] = useState<NexusInstance[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [msAccount, setMsAccount] = useState<any>(null);
  const [friends, setFriends] = useState<Friend[]>(DEMO_FRIENDS);
  const [chats, setChats] = useState<Record<string, ChatMsg[]>>({
    "1": [{ from: "AlexCraft", text: "Komm auf den Server!", at: Date.now() - 40000 }],
  });
  const [requests, setRequests] = useState<Friend[]>([
    { id: "r1", username: "CreeperKing", online: false, avatar: "C" },
  ]);
  const [announcement, setAnnouncement] = useState("");

  async function refreshConfig() {
    if (!window.nexus) return;
    const c = await window.nexus.getConfig();
    setConfig(c);
    setAnnouncement(c.announcement || "");
  }

  useEffect(() => {
    const boot = async () => {
      if (!window.nexus) {
        setConfig({
          clientId: "PUT_YOUR_ENTRA_APP_ID_HERE",
          redirectUri: "http://localhost",
          language: "Deutsch",
          theme: "Dark (NEXUS)",
          ramMb: 2048,
          minecraftPath: "%APPDATA%/.minecraft",
          featureFlags: { modrinth: true, friendsChat: true, autoUpdater: true },
        });
        setInstances([
          { id: "survival", name: "Survival World", version: "1.20.4", loader: "Vanilla", ramMb: 2048, playedMs: 0, icon: "grass", createdAt: Date.now() },
          { id: "fabric", name: "Fabric Modpack", version: "1.20.1", loader: "Fabric", ramMb: 3072, playedMs: 0, icon: "sword", createdAt: Date.now() },
          { id: "tech", name: "Tech Adventure", version: "1.19.2", loader: "Forge", ramMb: 2560, playedMs: 0, icon: "gear", createdAt: Date.now() },
          { id: "test", name: "Test Instance", version: "1.21", loader: "Vanilla", ramMb: 1536, playedMs: 0, icon: "crystal", createdAt: Date.now() },
        ]);
        return;
      }
      await refreshConfig();
      const inst = await window.nexus.getInstances();
      setInstances(inst);
      if (inst[0]) setSelectedInstanceId(inst[0].id);
      const session = localStorage.getItem("nexus-user");
      if (session) setUser(JSON.parse(session));
      const ms = localStorage.getItem("nexus-ms");
      if (ms) setMsAccount(JSON.parse(ms));
    };
    boot();
  }, []);

  useEffect(() => {
    if (instances.length && window.nexus) window.nexus.saveInstances(instances);
  }, [instances]);

  const addMessage = (friendId: string, msg: ChatMsg) => {
    setChats((prev) => ({ ...prev, [friendId]: [...(prev[friendId] || []), msg] }));
  };

  const value = useMemo(
    () => ({
      config,
      setConfig,
      refreshConfig,
      user,
      setUser: (u: NexusUser | null) => {
        setUser(u);
        if (u) localStorage.setItem("nexus-user", JSON.stringify(u));
        else localStorage.removeItem("nexus-user");
      },
      instances,
      setInstances,
      selectedInstanceId,
      setSelectedInstanceId,
      msAccount,
      setMsAccount: (a: any) => {
        setMsAccount(a);
        if (a) localStorage.setItem("nexus-ms", JSON.stringify(a));
      },
      friends,
      setFriends,
      chats,
      addMessage,
      requests,
      setRequests,
      announcement,
      setAnnouncement,
      onlineCount: friends.filter((f) => f.online).length,
    }),
    [config, user, instances, selectedInstanceId, msAccount, friends, chats, requests, announcement]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  return useContext(AppCtx);
}
