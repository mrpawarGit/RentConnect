// backend/routes/property.js
const express = require("express");
const router = express.Router();

const { authenticate, requireRole } = require("../middleware/authMiddleware");
const {
  createProperty,
  getPropertiesForLandlord,
  getLandlordDashboard,
  getTenantDashboard,
  addTenantByEmail,
  removeTenant,
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");

// Landlord: CRUD + list
router.post("/", authenticate, requireRole(["landlord"]), createProperty);
router.get(
  "/",
  authenticate,
  requireRole(["landlord"]),
  getPropertiesForLandlord
);
router.patch("/:id", authenticate, requireRole(["landlord"]), updateProperty);
router.delete("/:id", authenticate, requireRole(["landlord"]), deleteProperty);

// Manage tenants in a property
router.post(
  "/:id/tenants",
  authenticate,
  requireRole(["landlord"]),
  addTenantByEmail
); // body: { email }
router.delete(
  "/:id/tenants/:tenantId",
  authenticate,
  requireRole(["landlord"]),
  removeTenant
);

// Dashboards
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
