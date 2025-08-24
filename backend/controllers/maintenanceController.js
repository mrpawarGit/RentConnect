const MaintenanceRequest = require("../models/MaintenanceRequest");
const Property = require("../models/Property");

// Tenant creates a request
exports.createRequest = async (req, res) => {
  try {
    const { propertyId, category, urgency, description } = req.body;
    if (!propertyId || !category || !description) {
      return res
        .status(400)
        .json({ message: "propertyId, category, description required" });
    }

    // ensure tenant actually belongs to the property
    const property = await Property.findOne({
      _id: propertyId,
      tenants: req.user.id,
    });
    if (!property)
      return res
        .status(403)
        .json({ message: "You are not a tenant of this property" });

    const attachments = (req.files || []).map((f) => `/uploads/${f.filename}`);

    const doc = await MaintenanceRequest.create({
      tenant: req.user.id,
      property: propertyId,
      category,
      urgency,
      description,
      attachments,
      timeline: [
        { action: "created", note: "Request submitted", by: req.user.id },
      ],
    });

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Tenant: my requests
exports.myRequests = async (req, res) => {
  try {
    const items = await MaintenanceRequest.find({
      tenant: req.user.id,
    }).populate("property", "title address");
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Landlord: all requests for my properties
exports.landlordRequests = async (req, res) => {
  try {
    const items = await MaintenanceRequest.find()
      .populate({
        path: "property",
        match: { landlord: req.user.id },
        select: "title address landlord",
      })
      .populate("tenant", "name email")
      .lean();

    const filtered = items.filter((x) => x.property); // keep only landlord-owned
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Landlord updates status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const doc = await MaintenanceRequest.findById(id).populate(
      "property",
      "landlord"
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (String(doc.property.landlord) !== req.user.id) {
      return res.status(403).json({ message: "Not your property" });
    }

    if (!["pending", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    doc.status = status;
    doc.timeline.push({
      action:
        status === "in_progress"
          ? "in_progress"
          : status === "completed"
          ? "resolved"
          : "reviewed",
      note,
      by: req.user.id,
    });
    await doc.save();

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
