// frontend-rentConnect/src/pages/Chat.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../lib/api";
import { getSocket } from "../lib/socket";
import { getCurrentUser } from "../lib/auth";

function Ticks({ m, meId }) {
  const mine = String(m.from) === String(meId);
  if (!mine) return null;
  const delivered = !!m.deliveredAt;
  const read = !!m.readAt;
  return (
    <span className="ml-2 text-[11px] opacity-70 align-middle">
      ✓{delivered && "✓"}
      {read && "✓"}
    </span>
  );
}

function bubbleClass(m, meId) {
  const mine = String(m.from) === String(meId);
  return mine
    ? "self-end bg-blue-600 text-white"
    : "self-start bg-gray-100 text-gray-900";
}

// tiny debounce
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export default function Chat() {
  const me = getCurrentUser(); // { id, role }
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);

  const [current, setCurrent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [body, setBody] = useState("");
  const [typingPeer, setTypingPeer] = useState(false);

  const [tab, setTab] = useState("conversations"); // conversations | people

  const typingTimeout = useRef(null);
  const endRef = useRef(null);

  // load threads & partners
  async function loadThreads() {
    setThreadsLoading(true);
    try {
      const { data } = await api.get("/chat/threads");
      setThreads(Array.isArray(data) ? data : []);
    } finally {
      setThreadsLoading(false);
    }
  }
  const loadThreadsDebounced = useMemo(() => debounce(loadThreads, 250), []);

  useEffect(() => {
    loadThreads();
    setPartnersLoading(true);
    api
      .get("/chat/partners")
      .then(({ data }) => setPartners(data?.partners ?? []))
      .finally(() => setPartnersLoading(false));
  }, []);

  // support ?thread=<id>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get("thread");
    if (!tid) return;
    setThreads((prev) => {
      const found = prev.find((t) => String(t._id) === String(tid));
      if (found) setCurrent(found);
      return prev;
    });
  }, [threads]);

  // load messages when current changes
  useEffect(() => {
    if (!current) return;
    setLoadingMsgs(true);
    api
      .get(`/chat/threads/${current._id}/messages?limit=30`)
      .then(({ data }) => setMessages(Array.isArray(data) ? data : []))
      .finally(() => setLoadingMsgs(false));

    const s = getSocket();
    s.emit("thread:join", current._id);
    s.emit("thread:opened", { threadId: current._id });
    api.post(`/chat/threads/${current._id}/read`).catch(() => {});
  }, [current]);

  // socket listeners
  useEffect(() => {
    const s = getSocket();

    const onNew = (m) => {
      // if this message is for the active thread, append
      if (current && String(m.thread) === String(current._id)) {
        setMessages((prev) =>
          prev.some((x) => String(x._id) === String(m._id))
            ? prev
            : [...prev, m]
        );
        scrollToEnd();
      } else {
        // message for another thread → refresh thread list (debounced)
        loadThreadsDebounced();
      }
    };

    const onDelivered = ({ _id, deliveredAt }) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(_id) ? { ...m, deliveredAt } : m
        )
      );
    };

    const onReadBulk = ({ threadId, readAt }) => {
      if (!current || String(current._id) !== String(threadId)) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.readAt ? m : { ...m, readAt: readAt || new Date().toISOString() }
        )
      );
    };

    const onTyping = ({ threadId, userId, isTyping }) => {
      if (!current) return;
      if (String(threadId) !== String(current._id)) return;
      if (String(userId) === String(me.id)) return;
      setTypingPeer(!!isTyping);
      if (isTyping) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingPeer(false), 3000);
      }
    };

    const onPoke = () => {
      // recipient got poked (new message elsewhere) → refresh list
      loadThreadsDebounced();
    };

    s.on("message:new", onNew);
    s.on("message:delivered", onDelivered);
    s.on("message:read:bulk", onReadBulk);
    s.on("typing", onTyping);
    s.on("thread:poke", onPoke);

    return () => {
      s.off("message:new", onNew);
      s.off("message:delivered", onDelivered);
      s.off("message:read:bulk", onReadBulk);
      s.off("typing", onTyping);
      s.off("thread:poke", onPoke);
      clearTimeout(typingTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, me?.id]);

  function scrollToEnd() {
    requestAnimationFrame(() =>
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    );
  }

  // start chat from People tab
  async function startChatWith(partnerUser) {
    try {
      const payload =
        me.role === "landlord"
          ? { tenantId: partnerUser._id, landlordId: me.id }
          : { tenantId: me.id, landlordId: partnerUser._id };

      const { data: thread } = await api.post("/chat/threads/ensure", payload);

      setThreads((prev) => {
        const exists = prev.some((t) => String(t._id) === String(thread._id));
        return exists ? prev : [thread, ...prev];
      });

      setCurrent(thread);
      setTab("conversations");

      const url = new URL(window.location.href);
      url.searchParams.set("thread", thread._id);
      window.history.replaceState({}, "", url.toString());
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to start chat");
    }
  }

  // send a message
  function send(e) {
    e?.preventDefault();
    const text = body.trim();
    if (!text || !current) return;

    const s = getSocket();
    const tempId = `tmp:${Date.now()}`;
    const optimistic = {
      _id: tempId,
      thread: current._id,
      from: me.id,
      to: me.role === "tenant" ? current.landlord : current.tenant,
      body: text,
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setBody("");
    scrollToEnd();

    s.emit("message:send", { threadId: current._id, body: text }, (res) => {
      if (!res?.ok) {
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        alert(res?.error || "Failed to send");
        return;
      }
      const real = res.message;
      setMessages((prev) => prev.map((m) => (m._id === tempId ? real : m)));
      scrollToEnd();
    });
  }

  function onChange(e) {
    setBody(e.target.value);
    const s = getSocket();
    if (!current) return;
    s.emit("typing", {
      threadId: current._id,
      isTyping: e.target.value.length > 0,
    });
  }

  function unreadCount(t) {
    return me.role === "tenant" ? t.unreadForTenant : t.unreadForLandlord;
  }

  // partners grouped by property
  const groupedPartners = useMemo(() => {
    const map = new Map();
    for (const p of partners) {
      for (const prop of p.properties || []) {
        const key = prop.title || "Property";
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(p.user);
      }
    }
    return Array.from(map.entries());
  }, [partners]);

  return (
    <section className="mx-auto max-w-6xl p-4 md:p-6">
      <h2 className="text-2xl font-bold mb-4">Messages</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column: tabs */}
        <aside className="md:col-span-1 border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b flex">
            <button
              className={`mr-2 px-3 py-1.5 rounded ${
                tab === "conversations"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100"
              }`}
              onClick={() => setTab("conversations")}
            >
              Conversations
            </button>
            <button
              className={`px-3 py-1.5 rounded ${
                tab === "people" ? "bg-gray-900 text-white" : "bg-gray-100"
              }`}
              onClick={() => setTab("people")}
            >
              People
            </button>
          </div>

          {tab === "conversations" && (
            <div className="max-h-[70vh] overflow-y-auto">
              {threadsLoading && (
                <div className="p-4 text-sm text-gray-500">Loading…</div>
              )}
              {!threadsLoading && threads.length === 0 && (
                <div className="p-4 text-sm text-gray-500">
                  No conversations yet. Go to{" "}
                  <span className="font-medium">People</span> to start one.
                </div>
              )}
              <ul className="divide-y">
                {threads.map((t) => {
                  const isActive =
                    current && String(current._id) === String(t._id);
                  const unread = unreadCount(t) || 0;
                  return (
                    <li key={t._id}>
                      <button
                        onClick={() => setCurrent(t)}
                        className={
                          "w-full text-left px-4 py-3 hover:bg-gray-50 " +
                          (isActive ? "bg-gray-100" : "")
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {me.role === "tenant" ? "Landlord" : "Tenant"}
                          </div>
                          {unread > 0 && (
                            <span className="text-xs rounded-full bg-blue-600 text-white px-2 py-0.5">
                              {unread}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t.lastMessageAt
                            ? new Date(t.lastMessageAt).toLocaleString()
                            : "—"}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {tab === "people" && (
            <div className="max-h-[70vh] overflow-y-auto p-2">
              {partnersLoading && (
                <div className="p-4 text-sm text-gray-500">Loading…</div>
              )}
              {!partnersLoading && groupedPartners.length === 0 && (
                <div className="p-4 text-sm text-gray-500">
                  No related users found.
                </div>
              )}
              <div className="space-y-4">
                {groupedPartners.map(([title, users]) => (
                  <div key={title} className="border rounded">
                    <div className="px-3 py-2 border-b font-semibold">
                      {title}
                    </div>
                    <ul>
                      {users.map((u) => (
                        <li
                          key={u._id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
                        >
                          <div>
                            <div className="font-medium">
                              {u.name ||
                                (u.email ? u.email.split("@")[0] : "User")}
                            </div>
                            <div className="text-xs text-gray-500">
                              {u.email || "—"}
                            </div>
                          </div>
                          <button
                            className="text-sm px-3 py-1.5 rounded bg-blue-600 text-white"
                            onClick={() => startChatWith(u)}
                          >
                            Message
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right column: conversation */}
        <main className="md:col-span-2 border rounded-lg flex flex-col min-h-[70vh]">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold">
              {current
                ? me.role === "tenant"
                  ? "Landlord"
                  : "Tenant"
                : tab === "people"
                ? "Pick someone to message"
                : "Select a conversation"}
            </div>
            {typingPeer && <div className="text-xs text-gray-500">Typing…</div>}
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            {loadingMsgs && current && (
              <div className="text-sm text-gray-500">Loading messages…</div>
            )}
            {!loadingMsgs &&
              current &&
              messages.map((m) => (
                <div
                  key={m._id}
                  className={
                    "max-w-[80%] px-3 py-2 rounded " + bubbleClass(m, me.id)
                  }
                >
                  <div className="whitespace-pre-wrap break-words">
                    {m.body}
                  </div>
                  <div className="text-[11px] opacity-70 mt-1 text-right">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    <Ticks m={m} meId={me.id} />
                  </div>
                </div>
              ))}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={body}
              onChange={onChange}
              placeholder={
                current
                  ? "Type a message…"
                  : "Select a conversation or choose someone from People"
              }
              disabled={!current}
              className="flex-1 p-2 border rounded"
            />
            <button
              type="submit"
              disabled={!current || !body.trim()}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </main>
      </div>
    </section>
  );
}
