const Property = require("../models/Property");

// Create new property (landlord only)
exports.createProperty = async (req, res) => {
  try {
    if (req.user.role !== "landlord") {
      return res
        .status(403)
        .json({ message: "Only landlords can create properties" });
    }

    const { title, address, description, rentAmount } = req.body;
    if (!title || !address || !rentAmount) {
      return res
        .status(400)
        .json({ message: "Please provide title, address, and rent amount" });
    }

    const newProperty = new Property({
      title,
      address,
      description,
      rentAmount,
      landlord: req.user.id,
      tenants: [],
    });

    await newProperty.save();
    res.status(201).json(newProperty);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all properties for landlord
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
