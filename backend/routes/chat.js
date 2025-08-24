const router = require("express").Router();
const { authenticate } = require("../middleware/authMiddleware");
const Thread = require("../models/Thread");
const Message = require("../models/Message");
const Property = require("../models/Property");
const User = require("../models/User");

/* =========================
   THREAD LIST & MESSAGES
   ========================= */

// List threads for current user with populated user info
router.get("/threads", authenticate, async (req, res) => {
  try {
    const me = req.user.id;
    const threads = await Thread.find({
      $or: [{ tenant: me }, { landlord: me }],
    })
      .populate("tenant", "name email")
      .populate("landlord", "name email")
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    res.json(threads);
  } catch (e) {
    console.error("Error fetching threads:", e);
    res.status(500).json({ message: e.message });
  }
});

// Get messages in a thread (with pagination)
router.get("/threads/:id/messages", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { before, limit = 30 } = req.query;
    const me = req.user.id;

    // Verify user is part of this thread
    const thread = await Thread.findById(id);
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    if (
      ![String(thread.tenant), String(thread.landlord)].includes(String(me))
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const q = { thread: id };
    if (before) q.createdAt = { $lt: new Date(before) };

    const items = await Message.find(q)
      .populate("from", "name email")
      .populate("to", "name email")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json(items.reverse()); // oldest -> newest
  } catch (e) {
    console.error("Error fetching messages:", e);
    res.status(500).json({ message: e.message });
  }
});

// Send message via REST API (fallback when socket fails)
router.post("/threads/:id/messages", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { body = "", attachments = [] } = req.body;
    const me = req.user.id;

    if (!body.trim() && (!attachments || attachments.length === 0)) {
      return res
        .status(400)
        .json({ message: "Message body or attachments required" });
    }

    const thread = await Thread.findById(id).lean();
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    // verify membership
    if (
      ![String(thread.tenant), String(thread.landlord)].includes(String(me))
    ) {
      return res.status(403).json({ message: "Not a member of this thread" });
    }

    const to =
      String(me) === String(thread.tenant) ? thread.landlord : thread.tenant;

    const msg = await Message.create({
      thread: id,
      from: me,
      to,
      body: body.trim(),
      attachments,
    });

    const receiverRole =
      String(to) === String(thread.tenant) ? "tenant" : "landlord";
    await Thread.bumpUnread(id, receiverRole, body.trim());

    const full = await Message.findById(msg._id)
      .populate("from", "name email")
      .populate("to", "name email")
      .lean();

    res.json(full);
  } catch (e) {
    console.error("Error sending message via REST:", e);
    res.status(500).json({ message: e.message });
  }
});

// Mark messages as read (REST fallback)
router.post("/threads/:id/read", authenticate, async (req, res) => {
  try {
    const me = req.user.id;
    const { id } = req.params;

    // Verify user is part of this thread
    const thread = await Thread.findById(id);
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    if (
      ![String(thread.tenant), String(thread.landlord)].includes(String(me))
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Message.updateMany(
      { thread: id, to: me, readAt: null },
      { $set: { readAt: new Date() } }
    );

    // Clear unread count
    const viewerRole =
      String(me) === String(thread.tenant) ? "tenant" : "landlord";
    await Thread.clearUnread(id, viewerRole);

    res.json({ ok: true });
  } catch (e) {
    console.error("Error marking messages as read:", e);
    res.status(500).json({ message: e.message });
  }
});

/* =========================
   PARTNERS & THREAD ENSURE
   ========================= */

// List chat partners for current user
router.get("/partners", authenticate, async (req, res) => {
  try {
    const me = req.user.id;
    const role = req.user.role;

    if (role === "landlord") {
      // properties I own
      const props = await Property.find({ landlord: me })
        .select("_id title tenants")
        .populate({ path: "tenants", select: "_id name email role" })
        .lean();

      // flatten unique tenants
      const map = new Map();
      for (const p of props) {
        for (const t of p.tenants || []) {
          const key = String(t._id);
          if (!map.has(key)) map.set(key, { user: t, properties: [] });
          map.get(key).properties.push({ _id: p._id, title: p.title });
        }
      }

      return res.json({
        role,
        partners: Array.from(map.values()).map((x) => ({
          kind: "tenant",
          user: x.user,
          properties: x.properties,
        })),
      });
    } else {
      // tenant: properties I belong to
      const props = await Property.find({ tenants: me })
        .select("_id title landlord")
        .populate({ path: "landlord", select: "_id name email role" })
        .lean();

      // dedupe landlords
      const map = new Map();
      for (const p of props) {
        if (!p.landlord) continue;
        const key = String(p.landlord._id);
        if (!map.has(key)) map.set(key, { user: p.landlord, properties: [] });
        map.get(key).properties.push({ _id: p._id, title: p.title });
      }

      return res.json({
        role,
        partners: Array.from(map.values()).map((x) => ({
          kind: "landlord",
          user: x.user,
          properties: x.properties,
        })),
      });
    }
  } catch (e) {
    console.error("Error fetching partners:", e);
    res.status(500).json({ message: e.message });
  }
});

// Ensure a thread exists between a tenant & landlord, return it
router.post("/threads/ensure", authenticate, async (req, res) => {
  try {
    const { tenantId, landlordId } = req.body || {};
    const me = req.user.id;

    if (!tenantId || !landlordId) {
      return res.status(400).json({
        message: "tenantId and landlordId are required",
      });
    }

    // Validate users exist
    const [tenant, landlord] = await Promise.all([
      User.findById(tenantId).select("_id role name email").lean(),
      User.findById(landlordId).select("_id role name email").lean(),
    ]);

    if (!tenant || tenant.role !== "tenant") {
      return res.status(400).json({ message: "Invalid tenantId" });
    }
    if (!landlord || landlord.role !== "landlord") {
      return res.status(400).json({ message: "Invalid landlordId" });
    }

    // Verify the requesting user is part of this relationship
    if (![String(tenantId), String(landlordId)].includes(String(me))) {
      return res.status(403).json({
        message: "You can only create threads you're part of",
      });
    }

    // Validate relationship: tenant must belong to property owned by landlord
    const rel = await Property.exists({
      landlord: landlordId,
      tenants: tenantId,
    });

    if (!rel) {
      return res.status(403).json({
        message: "No property relationship between this landlord and tenant.",
      });
    }

    // Find or create thread
    let thread = await Thread.findOne({
      tenant: tenantId,
      landlord: landlordId,
    }).lean();

    if (!thread) {
      thread = await Thread.create({
        tenant: tenantId,
        landlord: landlordId,
        lastMessageAt: null,
        unreadForTenant: 0,
        unreadForLandlord: 0,
      });
      thread = thread.toObject();
    }

    // Populate user info
    thread.tenant = tenant;
    thread.landlord = landlord;

    res.json(thread);
  } catch (e) {
    console.error("Error ensuring thread:", e);
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
