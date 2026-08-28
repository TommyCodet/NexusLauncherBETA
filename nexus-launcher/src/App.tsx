import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { AppStateProvider, useApp } from "./store/AppState";
import AuthGate from "./components/AuthGate";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import FriendsDrawer from "./components/FriendsDrawer";
import Instances from "./pages/Instances";
import Play from "./pages/Play";
import Profile from "./pages/Profile";
import Mods from "./pages/Mods";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";

function Shell() {
  const [friendsOpen, setFriendsOpen] = useState(false);
  const { announcement, config } = useApp();
  const chatOn = config.featureFlags?.friendsChat !== false;

  return (
    <AuthGate>
      <div className="h-full flex bg-nexus-bg text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header onFriends={() => chatOn && setFriendsOpen(true)} />
          {announcement && (
            <div className="px-6 py-2 bg-indigo-600/30 border-b border-indigo-500/30 text-sm text-indigo-100">{announcement}</div>
          )}
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Instances />} />
              <Route path="/play" element={<Play />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/mods" element={<Mods />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
        </div>
        {chatOn && <FriendsDrawer open={friendsOpen} onClose={() => setFriendsOpen(false)} />}
      </div>
    </AuthGate>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}
