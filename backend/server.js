// backend/server.js
require("dotenv").config();

const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const Thread = require("./models/Thread");
const Message = require("./models/Message");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

/* ---------- ROUTES (keep your existing mounts) ---------- */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/maintenance", require("./routes/maintenance"));
app.use("/api/properties", require("./routes/property"));
app.use("/api/payments", require("./routes/payments")); // plural
app.use("/api/tenant", require("./routes/tenant"));
app.use("/api/landlord", require("./routes/landlord"));
app.use("/api/chat", require("./routes/chat"));

if (process.env.NODE_ENV === "production") {
  const client = path.join(__dirname, "..", "frontend-rentConnect", "dist");
  app.use(express.static(client));
  app.get("*", (_, res) => res.sendFile(path.join(client, "index.html")));
}

/* -------------------- SOCKET.IO -------------------- */
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || true, credentials: true },
  path: "/socket.io",
});

// JWT auth for sockets
io.use((socket, next) => {
  try {
    const auth = socket.handshake.auth?.token || "";
    const token = auth.replace("Bearer ", "");
    if (!token) return next(new Error("Unauthorized"));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: String(payload.id), role: payload.role };
    next();
  } catch (e) {
    next(new Error("Unauthorized"));
  }
});

// user presence map: userId -> Set(socketIds)
const userSockets = new Map();

io.on("connection", (socket) => {
  const uid = socket.user.id;
  if (!userSockets.has(uid)) userSockets.set(uid, new Set());
  userSockets.get(uid).add(socket.id);

  socket.on("thread:join", (threadId) => {
    socket.join(`thread:${threadId}`);
  });

  socket.on("thread:opened", async ({ threadId }) => {
    try {
      socket.join(`thread:${threadId}`);

      const thread = await Thread.findById(threadId).lean();
      if (!thread) return;
      const viewerRole =
        String(uid) === String(thread.tenant) ? "tenant" : "landlord";

      await Thread.clearUnread(threadId, viewerRole);

      const now = new Date();
      await Message.updateMany(
        { thread: threadId, to: uid, readAt: null },
        { $set: { readAt: now } }
      );

      io.to(`thread:${threadId}`).emit("message:read:bulk", {
        threadId,
        readAt: now,
        readerId: uid,
      });
    } catch (_) {}
  });

  // SEND MESSAGE: emit to thread room AND directly to recipient sockets
  socket.on("message:send", async (payload, ack) => {
    try {
      const { threadId, body = "", attachments = [] } = payload || {};
      if (!threadId) throw new Error("threadId required");

      const thread = await Thread.findById(threadId).lean();
      if (!thread) throw new Error("Thread not found");

      // verify membership
      if (
        ![String(thread.tenant), String(thread.landlord)].includes(String(uid))
      ) {
        throw new Error("Not a member of this thread");
      }

      const to =
        String(uid) === String(thread.tenant) ? thread.landlord : thread.tenant;

      const msg = await Message.create({
        thread: threadId,
        from: uid,
        to,
        body,
        attachments,
      });

      const receiverRole =
        String(to) === String(thread.tenant) ? "tenant" : "landlord";
      await Thread.bumpUnread(threadId, receiverRole);

      const full = await Message.findById(msg._id).lean();

      // 1) emit to the thread room (for all who joined)
      io.to(`thread:${threadId}`).emit("message:new", full);

      // 2) directly emit to recipient sockets (they may not be in the room yet)
      const recipientSockets = userSockets.get(String(to));
      if (recipientSockets && recipientSockets.size > 0) {
        const now = new Date();
        await Message.findByIdAndUpdate(msg._id, { deliveredAt: now });

        for (const sid of recipientSockets) {
          io.to(sid).emit("message:new", { ...full, deliveredAt: now }); // ensure delivered timestamp client-side
          io.to(sid).emit("thread:poke", {
            threadId,
            from: uid,
            at: now.toISOString(),
          });
        }

        // also inform room listeners about delivery
        io.to(`thread:${threadId}`).emit("message:delivered", {
          _id: msg._id,
          deliveredAt: now,
        });
      }

      // also echo to sender socket (in case they didn't join room yet)
      io.to(socket.id).emit("message:new", full);

      ack?.({ ok: true, message: full });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
    }
  });

  socket.on("typing", ({ threadId, isTyping }) => {
    socket.to(`thread:${threadId}`).emit("typing", {
      threadId,
      userId: uid,
      isTyping: !!isTyping,
    });
  });

  socket.on("disconnect", () => {
    const set = userSockets.get(uid);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) userSockets.delete(uid);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
