const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/authMiddleware");
const {
  createProperty,
  getPropertiesForLandlord,
} = require("../controllers/propertyController");

// Route to create new property (landlord only)
router.post("/", authenticate, requireRole(["landlord"]), createProperty);

// Route to get landlord's properties
router.get(
  "/",
  authenticate,
  requireRole(["landlord"]),
  getPropertiesForLandlord
);

module.exports = router;
