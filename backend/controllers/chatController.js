const Thread = require("../models/Thread");
const Message = require("../models/Message");
const Property = require("../models/Property");

// POST /api/chat/thread
exports.openThread = async (req, res) => {
  try {
    const { otherUserId, propertyId } = req.body;
    if (!otherUserId)
      return res.status(400).json({ message: "otherUserId required" });

    let tenantId, landlordId;
    if (req.user.role === "tenant") {
      tenantId = req.user.id;
      landlordId = otherUserId;
    } else if (req.user.role === "landlord") {
      tenantId = otherUserId;
      landlordId = req.user.id;
    } else {
      return res.status(403).json({ message: "Invalid role" });
    }

    if (propertyId) {
      const prop = await Property.findById(propertyId);
      if (!prop) return res.status(404).json({ message: "Property not found" });
    }

    let thread = await Thread.findOne({
      tenant: tenantId,
      landlord: landlordId,
      property: propertyId || null,
    });

    if (!thread) {
      thread = await Thread.create({
        tenant: tenantId,
        landlord: landlordId,
        property: propertyId || undefined,
      });
    }

    thread = await thread.populate([
      { path: "tenant", select: "name email" },
      { path: "landlord", select: "name email" },
      { path: "property", select: "title address" },
    ]);

    res.status(201).json(thread);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// GET /api/chat/threads
exports.myThreads = async (req, res) => {
  try {
    const filter =
      req.user.role === "tenant"
        ? { tenant: req.user.id }
        : { landlord: req.user.id };
    const threads = await Thread.find(filter)
      .sort({ updatedAt: -1 })
      .populate([
        { path: "tenant", select: "name email" },
        { path: "landlord", select: "name email" },
        { path: "property", select: "title address" },
      ]);
    res.json(threads);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// GET /api/chat/threads/:id/messages
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const thread = await Thread.findById(id);
    if (!thread) return res.status(404).json({ message: "Thread not found" });
    const isParticipant = [
      String(thread.tenant),
      String(thread.landlord),
    ].includes(req.user.id);
    if (!isParticipant) return res.status(403).json({ message: "Forbidden" });

    const msgs = await Message.find({ thread: id }).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// POST /api/chat/threads/:id/read
exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const thread = await Thread.findById(id);
    if (!thread) return res.status(404).json({ message: "Thread not found" });

    const me = req.user.id;
    const isTenant = String(thread.tenant) === me;

    await Message.updateMany(
      { thread: id, readBy: { $ne: me } },
      { $push: { readBy: me } }
    );

    if (isTenant) thread.unreadForTenant = 0;
    else thread.unreadForLandlord = 0;

    await thread.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
