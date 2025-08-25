require("dotenv").config();

const fs = require("fs");
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

// If you ever set secure cookies in the future
app.set("trust proxy", 1);

/* ---------- CORS (supports multiple origins) ---------- */
let allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Add your Vercel frontend URL
allowedOrigins.push("https://rent-connect-chi.vercel.app");

// Add localhost for development if no origins specified
if (process.env.NODE_ENV !== "production" && allowedOrigins.length === 1) {
  allowedOrigins.push("http://localhost:4000", "http://localhost:3000");
}

console.log("✅ Allowed CORS origins:", allowedOrigins); // Debug log

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : false,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
app.options("*", cors());

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/* ---------- Uploads (configurable & ensured) ---------- */
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

connectDB();

/* ---------- Health Check Endpoint ---------- */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    allowedOrigins: allowedOrigins, // Show allowed origins in health check
  });
});

/* ---------- API ROUTES ---------- */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/maintenance", require("./routes/maintenance"));
app.use("/api/properties", require("./routes/property"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/tenant", require("./routes/tenant"));
app.use("/api/landlord", require("./routes/landlord"));
app.use("/api/chat", require("./routes/chat"));

if (process.env.SERVE_CLIENT === "true") {
  const client = path.join(__dirname, "..", "frontend-rentConnect", "dist");
  app.use(express.static(client));
  // Fix this line for Express 5:
  app.get("/*", (_, res) => res.sendFile(path.join(client, "index.html")));
}

/* -------------------- SOCKET.IO -------------------- */
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : false,
    credentials: true,
    methods: ["GET", "POST"],
  },
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
    console.log(`User ${payload.id} connected via socket`);
    next();
  } catch (e) {
    console.error("Socket auth error:", e.message);
    next(new Error("Unauthorized"));
  }
});

// user presence map: userId -> Set(socketIds)
const userSockets = new Map();

io.on("connection", (socket) => {
  const uid = socket.user.id;

  if (!userSockets.has(uid)) userSockets.set(uid, new Set());
  userSockets.get(uid).add(socket.id);

  console.log(
    `User ${uid} connected, total connections: ${userSockets.get(uid).size}`
  );

  socket.on("thread:join", (threadId) => {
    console.log(`User ${uid} joining thread ${threadId}`);
    socket.join(`thread:${threadId}`);
  });

  socket.on("thread:leave", (threadId) => {
    console.log(`User ${uid} leaving thread ${threadId}`);
    socket.leave(`thread:${threadId}`);
  });

  socket.on("thread:opened", async ({ threadId }) => {
    try {
      socket.join(`thread:${threadId}`);

      const thread = await Thread.findById(threadId).lean();
      if (!thread) return;

      if (
        ![String(thread.tenant), String(thread.landlord)].includes(String(uid))
      ) {
        return;
      }

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
    } catch (e) {
      console.error("Error in thread:opened:", e);
    }
  });

  socket.on("message:send", async (payload, ack) => {
    try {
      const { threadId, body = "", attachments = [] } = payload || {};
      if (!threadId) throw new Error("threadId required");
      if (!body.trim() && (!attachments || attachments.length === 0)) {
        throw new Error("Message body or attachments required");
      }

      const thread = await Thread.findById(threadId).lean();
      if (!thread) throw new Error("Thread not found");

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
        body: body.trim(),
        attachments,
      });

      const receiverRole =
        String(to) === String(thread.tenant) ? "tenant" : "landlord";
      await Thread.bumpUnread(threadId, receiverRole, body.trim());

      const full = await Message.findById(msg._id)
        .populate("from", "name email")
        .populate("to", "name email")
        .lean();

      io.to(`thread:${threadId}`).emit("message:new", full);

      const recipientSockets = userSockets.get(String(to));
      if (recipientSockets && recipientSockets.size > 0) {
        const now = new Date();
        await Message.findByIdAndUpdate(msg._id, { deliveredAt: now });

        for (const sid of recipientSockets) {
          io.to(sid).emit("message:new", { ...full, deliveredAt: now });
          io.to(sid).emit("thread:poke", {
            threadId,
            from: uid,
            at: now.toISOString(),
          });
        }

        io.to(`thread:${threadId}`).emit("message:delivered", {
          _id: msg._id,
          deliveredAt: now,
        });
      }

      ack?.({ ok: true, message: full });
    } catch (e) {
      console.error("Error in message:send:", e);
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
    console.log(`User ${uid} disconnected`);
    const set = userSockets.get(uid);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) {
        userSockets.delete(uid);
      }
    }
  });
});

/* ---------- Error Handling Middleware ---------- */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
});

/* ---------- Server Listen (CRITICAL FOR RENDER) ---------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `✅ Allowed origins: ${
      allowedOrigins.length ? allowedOrigins.join(", ") : "none configured"
    }`
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});
