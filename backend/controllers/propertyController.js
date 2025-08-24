// controllers/propertyController.js
const Property = require("../models/Property");

// Create property (landlord only)
exports.createProperty = async (req, res) => {
  try {
    const { title, address, description, rentAmount, tenants = [] } = req.body;
    if (!title || !address || !rentAmount) {
      return res
        .status(400)
        .json({ message: "title, address, rentAmount required" });
    }

    const property = await Property.create({
      title,
      address,
      description,
      rentAmount,
      landlord: req.user.id,
      tenants,
    });

    res.status(201).json(property);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// List properties for current landlord
exports.getPropertiesForLandlord = async (req, res) => {
  try {
    const properties = await Property.find({ landlord: req.user.id }).populate(
      "tenants",
      "name email"
    );
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Landlord dashboard (summary)
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

// Tenant dashboard (simple placeholder)
exports.getTenantDashboard = async (req, res) => {
  try {
    // Properties where this user is tenant
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
