// backend/routes/chat.js
const router = require("express").Router();
const { authenticate } = require("../middleware/authMiddleware");
const Thread = require("../models/Thread");
const Message = require("../models/Message");
const Property = require("../models/Property");
const User = require("../models/User");

/* =========================
   THREAD LIST & MESSAGES
   ========================= */

// List threads for current user
router.get("/threads", authenticate, async (req, res) => {
  try {
    const me = req.user.id;
    const threads = await Thread.find({
      $or: [{ tenant: me }, { landlord: me }],
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    res.json(threads);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get messages in a thread (with pagination)
router.get("/threads/:id/messages", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { before, limit = 30 } = req.query;

    const q = { thread: id };
    if (before) q.createdAt = { $lt: new Date(before) };

    const items = await Message.find(q)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json(items.reverse()); // oldest -> newest
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Mark messages as read (REST fallback)
router.post("/threads/:id/read", authenticate, async (req, res) => {
  try {
    const me = req.user.id;
    const { id } = req.params;

    await Message.updateMany(
      { thread: id, to: me, readAt: null },
      { $set: { readAt: new Date() } }
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* =========================
   PARTNERS & THREAD ENSURE
   ========================= */

// List chat partners for current user
// - Landlord: all unique tenants across properties they own
// - Tenant: the landlord(s) of properties they belong to
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
    res.status(500).json({ message: e.message });
  }
});

// Ensure a thread exists between a tenant & landlord, return it
// Body: { tenantId, landlordId }
router.post("/threads/ensure", authenticate, async (req, res) => {
  try {
    const { tenantId, landlordId } = req.body || {};
    if (!tenantId || !landlordId)
      return res
        .status(400)
        .json({ message: "tenantId and landlordId are required" });

    // Validate users exist
    const [tenant, landlord] = await Promise.all([
      User.findById(tenantId).select("_id role").lean(),
      User.findById(landlordId).select("_id role").lean(),
    ]);
    if (!tenant || tenant.role !== "tenant")
      return res.status(400).json({ message: "Invalid tenantId" });
    if (!landlord || landlord.role !== "landlord")
      return res.status(400).json({ message: "Invalid landlordId" });

    // Validate relationship:
    // - tenant must belong to at least one property owned by landlord
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

    res.json(thread);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
