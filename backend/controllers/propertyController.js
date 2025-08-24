// backend/controllers/propertyController.js
const Property = require("../models/Property");
const User = require("../models/User");

/* ---------------------- CREATE PROPERTY (LANDLORD) ---------------------- */
exports.createProperty = async (req, res) => {
  try {
    const { title, address, description, rentAmount, tenants = [] } = req.body;
    if (!title || !address || !rentAmount) {
      return res
        .status(400)
        .json({ message: "title, address, rentAmount required" });
    }

    // ensure any provided tenants exist and are tenants
    let tenantIds = [];
    if (tenants && tenants.length) {
      const found = await User.find(
        { _id: { $in: tenants }, role: "tenant" },
        "_id"
      );
      tenantIds = found.map((u) => u._id);
    }

    const property = await Property.create({
      title,
      address,
      description,
      rentAmount,
      landlord: req.user.id,
      tenants: tenantIds,
    });

    const populated = await Property.findById(property._id)
      .populate("tenants", "name email")
      .populate("landlord", "name email");

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ------------------- LIST PROPERTIES FOR THIS LANDLORD ------------------ */
exports.getPropertiesForLandlord = async (req, res) => {
  try {
    const properties = await Property.find({ landlord: req.user.id })
      .sort({ createdAt: -1 })
      .populate("tenants", "name email")
      .populate("landlord", "name email");

    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* --------------------------- LANDLORD DASHBOARD ------------------------- */
exports.getLandlordDashboard = async (req, res) => {
  try {
    const properties = await Property.find({ landlord: req.user.id }).populate(
      "tenants",
      "name email"
    );

    res.json({
      message: "Landlord dashboard data",
      counts: {
        properties: properties.length,
        tenants: properties.reduce((n, p) => n + p.tenants.length, 0),
      },
      properties,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ----------------------------- TENANT DASHBOARD ------------------------- */
exports.getTenantDashboard = async (req, res) => {
  try {
    const properties = await Property.find({ tenants: req.user.id }).populate(
      "landlord",
      "name email"
    );

    res.json({
      message: "Tenant dashboard data",
      counts: { properties: properties.length },
      properties,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ------------------------ ADD TENANT BY EMAIL (LANDLORD) ---------------- */
exports.addTenantByEmail = async (req, res) => {
  try {
    const { id } = req.params; // property id
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email required" });

    // ensure property belongs to landlord
    const property = await Property.findOne({ _id: id, landlord: req.user.id });
    if (!property)
      return res
        .status(404)
        .json({ message: "Property not found or not yours" });

    // find tenant user
    const tenant = await User.findOne({ email, role: "tenant" });
    if (!tenant)
      return res
        .status(404)
        .json({ message: "No tenant user with this email" });

    // add if not already present
    if (!property.tenants.map(String).includes(String(tenant._id))) {
      property.tenants.push(tenant._id);
      await property.save();
    }

    const populated = await Property.findById(property._id).populate(
      "tenants",
      "name email"
    );
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ------------------------ REMOVE TENANT (LANDLORD) ---------------------- */
exports.removeTenant = async (req, res) => {
  try {
    const { id, tenantId } = req.params; // property id & tenant id
    const property = await Property.findOne({ _id: id, landlord: req.user.id });
    if (!property)
      return res
        .status(404)
        .json({ message: "Property not found or not yours" });

    property.tenants = property.tenants.filter(
      (t) => String(t) !== String(tenantId)
    );
    await property.save();

    const populated = await Property.findById(property._id).populate(
      "tenants",
      "name email"
    );
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ------------------------- UPDATE PROPERTY (BASIC) ---------------------- */
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, address, description, rentAmount } = req.body;

    const property = await Property.findOneAndUpdate(
      { _id: id, landlord: req.user.id },
      { $set: { title, address, description, rentAmount } },
      { new: true }
    ).populate("tenants", "name email");

    if (!property)
      return res
        .status(404)
        .json({ message: "Property not found or not yours" });
    res.json(property);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ------------------------- DELETE PROPERTY (LANDLORD) ------------------- */
exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Property.findOneAndDelete({
      _id: id,
      landlord: req.user.id,
    });
    if (!doc)
      return res
        .status(404)
        .json({ message: "Property not found or not yours" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
