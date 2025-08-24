// backend/server.js
require("dotenv").config();

const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { authenticate, requireRole } = require("./middleware/authMiddleware");

// Chat models for Socket.IO handlers
const Thread = require("./models/Thread");
const Message = require("./models/Message");

const app = express();

/* ------------------------- DB CONNECTION ------------------------- */
connectDB();

/* --------------------------- MIDDLEWARE -------------------------- */
// Allow your frontend dev server origin (defaults to Vite on 4000 based on your setup)
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:4000";
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// Serve uploaded files (images/videos for maintenance requests)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ----------------------------- ROUTES ---------------------------- */
// Auth
app.use("/api/auth", require("./routes/auth"));

// Properties (landlord-only operations)
app.use("/api/properties", require("./routes/property"));

// Dashboards (exposes /api/landlord/dashboard and /api/tenant/dashboard)
app.use("/api", require("./routes/dashboard"));

// Maintenance (create/list/update status + file uploads)
app.use("/api/maintenance", require("./routes/maintenance"));

// Chat REST endpoints (threads, messages, mark read)
app.use("/api/chat", require("./routes/chat"));

// payment
app.use("/api/payments", require("./routes/payments"));

/* ----------------------- PROTECTED TEST ROUTE -------------------- */
app.get(
  "/api/protected",
  authenticate,
  requireRole(["tenant", "landlord"]),
  (req, res) => {
    res.json({ message: `Welcome! Your user role is ${req.user.role}` });
  }
);

/* ------------------------- SOCKET.IO SERVER ---------------------- */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

// Track user sockets (optional for presence/future features)
const userSockets = new Map();

// JWT auth for sockets
io.use((socket, next) => {
  try {
    // Accept token either via handshake.auth.token or Authorization header
    const auth = socket.handshake.auth || {};
    const header = auth.token || socket.handshake.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;
    if (!token) return next(new Error("No token"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const uid = socket.user.id;

  // Track connections
  if (!userSockets.has(uid)) userSockets.set(uid, new Set());
  userSockets.get(uid).add(socket.id);

  // Personal room for direct notifications
  socket.join(`user:${uid}`);

  // Join a thread room to receive live updates for that conversation
  socket.on("thread:join", (threadId) => {
    socket.join(`thread:${threadId}`);
  });

  // Send a chat message
  socket.on("message:send", async ({ threadId, body }) => {
    try {
      if (!threadId || !body) return;

      const thread = await Thread.findById(threadId);
      if (!thread) return;

      const isParticipant = [
        String(thread.tenant),
        String(thread.landlord),
      ].includes(uid);
      if (!isParticipant) return;

      const msg = await Message.create({ thread: threadId, sender: uid, body });

      // Update thread summary & unread counts
      thread.lastMessageAt = new Date();
      thread.lastMessagePreview = body.slice(0, 120);

      const isTenant = String(thread.tenant) === uid;
      if (isTenant)
        thread.unreadForLandlord = (thread.unreadForLandlord || 0) + 1;
      else thread.unreadForTenant = (thread.unreadForTenant || 0) + 1;

      await thread.save();

      const payload = {
        ...msg.toObject(),
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      };

      // Emit to participants in the thread room
      io.to(`thread:${threadId}`).emit("message:new", payload);

      // Also notify the other participant via their personal room (for sidebar/toasts)
      const otherUserId = isTenant
        ? String(thread.landlord)
        : String(thread.tenant);
      io.to(`user:${otherUserId}`).emit("thread:updated", {
        threadId,
        lastMessagePreview: thread.lastMessagePreview,
        lastMessageAt: thread.lastMessageAt,
        unreadForMe: isTenant
          ? thread.unreadForLandlord
          : thread.unreadForTenant,
      });
    } catch {
      // You can add error emits if needed
    }
  });

  // Mark thread as read
  socket.on("thread:read", async (threadId) => {
    try {
      const thread = await Thread.findById(threadId);
      if (!thread) return;

      const isTenant = String(thread.tenant) === uid;

      await Message.updateMany(
        { thread: threadId, readBy: { $ne: uid } },
        { $push: { readBy: uid } }
      );

      if (isTenant) thread.unreadForTenant = 0;
      else thread.unreadForLandlord = 0;
      await thread.save();

      io.to(`thread:${threadId}`).emit("thread:read:ack", {
        threadId,
        by: uid,
      });
    } catch {
      // ignore
    }
  });

  socket.on("disconnect", () => {
    const set = userSockets.get(uid);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) userSockets.delete(uid);
    }
  });
});

/* ----------------------------- SERVER ---------------------------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 CORS Origin allowed: ${CLIENT_URL}`);
});
