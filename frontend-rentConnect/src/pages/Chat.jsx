import React, { useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { getSocket } from "../lib/socket";
import { getCurrentUser } from "../lib/auth";
import { useToast } from "../components/Toaster";
import RequestTimeline from "../components/RequestTimeline"; // optional later if you want to show related timelines

export default function Chat() {
  const me = getCurrentUser();
  const { push } = useToast();

  const [threads, setThreads] = useState([]);
  const [current, setCurrent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const endRef = useRef(null);

  async function loadThreads() {
    const { data } = await api.get("/chat/threads");
    setThreads(data);
    if (!current && data.length) setCurrent(data[0]);
  }

  async function loadMessages(threadId) {
    const { data } = await api.get(`/chat/threads/${threadId}/messages`);
    setMessages(data);
    // mark read via REST and socket
    await api.post(`/chat/threads/${threadId}/read`);
    const socket = getSocket();
    socket.emit("thread:read", threadId);
  }

  useEffect(() => {
    loadThreads();
    const socket = getSocket();

    // thread updates (for sidebar counters)
    socket.on("thread:updated", (p) => {
      push("New message received");
      loadThreads();
      if (current && p.threadId === current._id) loadMessages(current._id);
    });

    // new messages in the open thread
    socket.on("message:new", (msg) => {
      if (current && msg.thread === current._id) {
        setMessages((m) => [...m, msg]);
        scrollToBottom();
      } else {
        push("New message in another thread");
      }
    });

    return () => {
      socket.off("thread:updated");
      socket.off("message:new");
    };
  }, [current?._id]);

  useEffect(() => {
    if (current) {
      const socket = getSocket();
      socket.emit("thread:join", current._id);
      loadMessages(current._id);
    }
  }, [current?._id]);

  function scrollToBottom() {
    requestAnimationFrame(() =>
      endRef.current?.scrollIntoView({ behavior: "smooth" })
    );
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !current) return;
    const socket = getSocket();
    socket.emit("message:send", { threadId: current._id, body: text });
    setBody("");
    // optimistic append
    setMessages((m) => [
      ...m,
      {
        _id: "tmp-" + Date.now(),
        thread: current._id,
        sender: me.id,
        body: text,
        createdAt: new Date().toISOString(),
      },
    ]);
    scrollToBottom();
  }

  const displayName = (t) => {
    const other = me.role === "tenant" ? t.landlord : t.tenant;
    return other?.name || "Conversation";
  };

  return (
    <section className="grid grid-cols-12 gap-4 h-[calc(100vh-10rem)]">
      {/* Sidebar */}
      <aside className="col-span-4 border rounded p-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Messages</h2>
          <button className="text-sm underline" onClick={loadThreads}>
            Refresh
          </button>
        </div>
        <ul className="space-y-2">
          {threads.map((t) => {
            const isActive = current?._id === t._id;
            const unread =
              me.role === "tenant" ? t.unreadForTenant : t.unreadForLandlord;
            return (
              <li key={t._id}>
                <button
                  onClick={() => setCurrent(t)}
                  className={`w-full text-left p-3 rounded border ${
                    isActive ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between">
                    <div className="font-medium">{displayName(t)}</div>
                    {unread > 0 && (
                      <span className="px-2 py-0.5 text-xs rounded bg-blue-600 text-white">
                        {unread}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {t.lastMessagePreview || "No messages yet"}
                  </div>
                  {t.property && (
                    <div className="text-xs text-gray-500">
                      {t.property.title}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
          {threads.length === 0 && (
            <p className="text-sm text-gray-500">No conversations yet.</p>
          )}
        </ul>
      </aside>

      {/* Thread */}
      <div className="col-span-8 border rounded flex flex-col">
        <div className="p-3 border-b">
          <div className="font-semibold">
            {current ? displayName(current) : "Select a conversation"}
          </div>
          {current?.property && (
            <div className="text-xs text-gray-600">
              {current.property.title} — {current.property.address}
            </div>
          )}
        </div>

        <div className="flex-1 p-3 overflow-y-auto">
          {messages.map((m) => {
            const mine = m.sender === me.id || m.sender?._id === me.id;
            return (
              <div
                key={m._id}
                className={`max-w-[75%] mb-2 ${
                  mine ? "ml-auto text-right" : ""
                }`}
              >
                <div
                  className={`inline-block px-3 py-2 rounded ${
                    mine ? "bg-blue-600 text-white" : "bg-gray-100"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{m.body}</div>
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {new Date(m.createdAt || Date.now()).toLocaleString()}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
          <input
            className="flex-1 border rounded p-2"
            placeholder="Type a message…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button className="px-4 py-2 border rounded hover:bg-gray-50">
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
