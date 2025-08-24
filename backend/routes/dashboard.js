const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/authMiddleware");
const {
  getLandlordDashboard,
  getTenantDashboard,
} = require("../controllers/propertyController");

// Frontend expects these:
router.get(
  "/landlord/dashboard",
  authenticate,
  requireRole(["landlord"]),
  getLandlordDashboard
);
router.get(
  "/tenant/dashboard",
  authenticate,
  requireRole(["tenant"]),
  getTenantDashboard
);

module.exports = router;
