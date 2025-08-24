// frontend-rentConnect/src/pages/Chat.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import api from "../lib/api";
import { getSocket, isSocketConnected } from "../lib/socket";
import { getCurrentUser } from "../lib/auth";

function Ticks({ m, meId }) {
  const mine = String(m.from._id || m.from) === String(meId);
  if (!mine) return null;

  const delivered = !!m.deliveredAt;
  const read = !!m.readAt;

  return (
    <span className="ml-2 text-[11px] opacity-70 align-middle">
      ✓{delivered && "✓"}
      {read && <span className="text-blue-400">✓</span>}
    </span>
  );
}

function bubbleClass(m, meId) {
  const mine = String(m.from._id || m.from) === String(meId);
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
  const me = getCurrentUser();
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);

  const [current, setCurrent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [body, setBody] = useState("");
  const [typingPeer, setTypingPeer] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const [tab, setTab] = useState("conversations");

  const typingTimeout = useRef(null);
  const endRef = useRef(null);
  const lastTypingEmit = useRef(0);
  const sendTimeouts = useRef(new Map()); // Track send timeouts

  if (!me) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Please log in to access chat.</p>
        </div>
      </div>
    );
  }

  // load threads & partners
  const loadThreads = useCallback(async () => {
    setThreadsLoading(true);
    try {
      const { data } = await api.get("/chat/threads");
      setThreads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading threads:", error);
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  const loadThreadsDebounced = useMemo(
    () => debounce(loadThreads, 250),
    [loadThreads]
  );

  useEffect(() => {
    loadThreads();

    setPartnersLoading(true);
    api
      .get("/chat/partners")
      .then(({ data }) => setPartners(data?.partners ?? []))
      .catch((error) => console.error("Error loading partners:", error))
      .finally(() => setPartnersLoading(false));
  }, [loadThreads]);

  // Socket connection management
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.warn("Socket not available, using REST API only");
      setSocketConnected(false);
      return;
    }

    const handleConnect = () => {
      console.log("Socket connected successfully");
      setSocketConnected(true);
    };

    const handleDisconnect = (reason) => {
      console.log("Socket disconnected:", reason);
      setSocketConnected(false);
    };

    const handleConnectError = (error) => {
      console.warn("Socket connection failed:", error.message);
      setSocketConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    // Set initial state
    setSocketConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, []);

  // support ?thread=<id>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get("thread");
    if (!tid || threads.length === 0) return;

    const found = threads.find((t) => String(t._id) === String(tid));
    if (found) {
      setCurrent(found);
    }
  }, [threads]);

  // load messages when current changes
  useEffect(() => {
    if (!current) {
      setMessages([]);
      return;
    }

    setLoadingMsgs(true);
    api
      .get(`/chat/threads/${current._id}/messages?limit=50`)
      .then(({ data }) => {
        setMessages(Array.isArray(data) ? data : []);
        scrollToEnd();
      })
      .catch((error) => console.error("Error loading messages:", error))
      .finally(() => setLoadingMsgs(false));

    const socket = getSocket();
    if (socket && socketConnected) {
      socket.emit("thread:join", current._id);
      socket.emit("thread:opened", { threadId: current._id });
    }

    api.post(`/chat/threads/${current._id}/read`).catch(() => {});
  }, [current, socketConnected]);

  // socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNew = (m) => {
      // if this message is for the active thread, append/merge
      if (current && String(m.thread) === String(current._id)) {
        setMessages((prev) => {
          // Already have this exact server message?
          const existsById = prev.some((x) => String(x._id) === String(m._id));
          if (existsById) return prev;

          // If it's my message, try to replace an optimistic temp one
          const isMine = String(m.from?._id || m.from) === String(me.id);

          if (isMine) {
            const idx = prev.findIndex(
              (x) =>
                String(x.thread) === String(m.thread) &&
                String(x._id).startsWith("tmp:") &&
                String(x.from?._id || x.from) === String(me.id) &&
                x.body === m.body
            );
            if (idx !== -1) {
              const copy = [...prev];
              copy[idx] = m; // replace optimistic with real
              return copy;
            }
          }

          return [...prev, m];
        });
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

    socket.on("message:new", onNew);
    socket.on("message:delivered", onDelivered);
    socket.on("message:read:bulk", onReadBulk);
    socket.on("typing", onTyping);
    socket.on("thread:poke", onPoke);

    return () => {
      socket.off("message:new", onNew);
      socket.off("message:delivered", onDelivered);
      socket.off("message:read:bulk", onReadBulk);
      socket.off("typing", onTyping);
      socket.off("thread:poke", onPoke);
      clearTimeout(typingTimeout.current);
    };
  }, [current, me?.id, loadThreadsDebounced]);

  function scrollToEnd() {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  }

  // REST API fallback for sending messages
  const sendViaREST = useCallback(
    async (text, tempId = null) => {
      try {
        const response = await api.post(
          `/chat/threads/${current._id}/messages`,
          {
            body: text,
          }
        );

        if (tempId) {
          // Replace optimistic message with real one (or drop if echo already in list)
          setMessages((prev) => {
            const real = response.data;
            const existsById = prev.some(
              (m) => String(m._id) === String(real._id)
            );
            if (existsById) {
              // Server echo already arrived; just drop the optimistic one
              return prev.filter((m) => m._id !== tempId);
            }
            return prev.map((m) => (m._id === tempId ? real : m));
          });
        } else {
          // Add new message unless server echo already added it
          const newMessage = {
            _id: response.data._id,
            thread: current._id,
            from: { _id: me.id, name: me.name, email: me.email },
            to: me.role === "tenant" ? current.landlord : current.tenant,
            body: text,
            createdAt: response.data.createdAt,
            deliveredAt: null,
            readAt: null,
          };
          setMessages((prev) => {
            if (prev.some((m) => String(m._id) === String(newMessage._id))) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
        scrollToEnd();
      } catch (error) {
        console.error("REST send failed:", error);
        if (tempId) {
          // Remove failed optimistic message
          setMessages((prev) => prev.filter((m) => m._id !== tempId));
        }
        alert("Failed to send message. Please try again.");
      }
    },
    [current, me]
  );

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
      console.error("Error starting chat:", e);
      alert(e?.response?.data?.message || e.message || "Failed to start chat");
    }
  }

  // send a message
  function send(e) {
    e?.preventDefault();
    const text = body.trim();
    if (!text || !current) return;

    const socket = getSocket();

    // Clear input immediately
    setBody("");

    if (!socket || !socketConnected) {
      // Fallback to REST API if socket is not available
      sendViaREST(text);
      return;
    }

    // Use Socket.IO - create optimistic message
    const tempId = `tmp:${Date.now()}`;
    const optimistic = {
      _id: tempId,
      thread: current._id,
      from: { _id: me.id, name: me.name, email: me.email },
      to: me.role === "tenant" ? current.landlord : current.tenant,
      body: text,
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
    };

    setMessages((prev) => [...prev, optimistic]);
    scrollToEnd();

    // Send via socket with timeout
    const sendTimeout = setTimeout(() => {
      // If socket doesn't respond in 5 seconds, fallback to REST
      console.log("Socket send timeout, falling back to REST API");
      sendViaREST(text, tempId);
      sendTimeouts.current.delete(tempId);
    }, 5000);

    sendTimeouts.current.set(tempId, sendTimeout);

    socket.emit(
      "message:send",
      { threadId: current._id, body: text },
      (res) => {
        // Clear the timeout since we got a response
        const timeout = sendTimeouts.current.get(tempId);
        if (timeout) {
          clearTimeout(timeout);
          sendTimeouts.current.delete(tempId);
        }

        if (!res || !res.ok) {
          // Socket failed, fallback to REST API
          console.log("Socket send failed, trying REST API...");
          sendViaREST(text, tempId);
          return;
        }

        // Socket success - replace optimistic message with real one,
        // or drop the optimistic if the server echo already added it.
        const real = res.message;
        setMessages((prev) => {
          const existsById = prev.some(
            (m) => String(m._id) === String(real._id)
          );
          if (existsById) {
            // message:new already inserted it — remove optimistic
            return prev.filter((m) => m._id !== tempId);
          }
          // Otherwise, replace optimistic with the real message
          return prev.map((m) => (m._id === tempId ? real : m));
        });
        scrollToEnd();
      }
    );
  }

  function onChange(e) {
    setBody(e.target.value);

    const socket = getSocket();
    if (!current || !socket || !socketConnected) return;

    // Throttle typing events
    const now = Date.now();
    if (now - lastTypingEmit.current < 500) return;
    lastTypingEmit.current = now;

    socket.emit("typing", {
      threadId: current._id,
      isTyping: e.target.value.length > 0,
    });
  }

  function unreadCount(t) {
    return me.role === "tenant" ? t.unreadForTenant : t.unreadForLandlord;
  }

  function getPartnerName(thread) {
    if (!thread) return "Unknown";

    const partner = me.role === "tenant" ? thread.landlord : thread.tenant;
    if (!partner) return "Unknown";

    return partner.name || partner.email?.split("@")[0] || "User";
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      sendTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      sendTimeouts.current.clear();
    };
  }, []);

  return (
    <section className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Messages</h2>
        <div
          className={`text-xs px-2 py-1 rounded ${
            socketConnected
              ? "bg-green-50 text-green-600"
              : "bg-yellow-50 text-yellow-600"
          }`}
        >
          {socketConnected ? "Real-time" : "Basic mode"}
        </div>
      </div>

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
                          <div className="font-medium">{getPartnerName(t)}</div>
                          {unread > 0 && (
                            <span className="text-xs rounded-full bg-blue-600 text-white px-2 py-0.5">
                              {unread}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {t.lastMessage || "No messages yet"}
                        </div>
                        <div className="text-xs text-gray-400">
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
                ? getPartnerName(current)
                : tab === "people"
                ? "Pick someone to message"
                : "Select a conversation"}
            </div>
            {typingPeer && <div className="text-xs text-gray-500">Typing…</div>}
          </div>

          {/* Messages list is a flex column so self-start/self-end align left/right */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
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
              className="flex-1 p-2 border rounded disabled:opacity-50"
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
