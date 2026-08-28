import { useState } from "react";
import { useApp } from "../store/AppState";

export default function FriendsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { friends, setFriends, chats, addMessage, requests, setRequests } = useApp();
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");

  if (!open) return null;
  const friend = friends.find((f) => f.id === active);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-[380px] h-full bg-[#101018] border-l border-nexus-border flex flex-col">
        <div className="p-4 border-b border-nexus-border flex items-center justify-between">
          <div className="font-semibold">Friends</div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
        </div>
        {!active ? (
          <>
            <div className="p-3">
              <input
                className="input"
                placeholder="Freund per Username hinzufügen"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && search.trim()) {
                    setFriends([
                      ...friends,
                      {
                        id: crypto.randomUUID(),
                        username: search.trim(),
                        online: false,
                        avatar: search.trim()[0].toUpperCase(),
                      },
                    ]);
                    setSearch("");
                  }
                }}
              />
            </div>
            {requests.length > 0 && (
              <div className="px-3 pb-2">
                <div className="label">Anfragen</div>
                {requests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2">
                    <span>{r.username}</span>
                    <div className="flex gap-2">
                      <button
                        className="btn text-xs"
                        onClick={() => {
                          setFriends([...friends, { ...r, online: true }]);
                          setRequests(requests.filter((x) => x.id !== r.id));
                        }}
                      >
                        Accept
                      </button>
                      <button className="btn text-xs" onClick={() => setRequests(requests.filter((x) => x.id !== r.id))}>
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex-1 overflow-auto px-2">
              {friends.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActive(f.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1a1a26] text-left"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-[#2a2a4a] flex items-center justify-center font-semibold">
                      {f.avatar}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#101018] ${
                        f.online ? "bg-emerald-400" : "bg-zinc-500"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-sm">{f.username}</div>
                    <div className="text-[11px] text-zinc-500">
                      {f.online ? `spielt ${f.instance || "Lobby"}` : "offline"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <button className="px-4 py-2 text-sm text-zinc-400 text-left" onClick={() => setActive(null)}>
              ← {friend?.username}
            </button>
            <div className="flex-1 overflow-auto px-4 space-y-2">
              {(chats[active] || []).map((m, i) => (
                <div key={i} className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.from === "me" ? "ml-auto bg-indigo-600" : "bg-[#1a1a26]"}`}>
                  {m.text}
                </div>
              ))}
            </div>
            <form
              className="p-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                addMessage(active, { from: "me", text, at: Date.now() });
                setTimeout(() => addMessage(active, { from: friend?.username || "bot", text: "Demo-Chat: Nachricht empfangen.", at: Date.now() }), 600);
                setText("");
              }}
            >
              <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Nachricht..." />
              <button className="btn-primary px-3 rounded-lg">➤</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
