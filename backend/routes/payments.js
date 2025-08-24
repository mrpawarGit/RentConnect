const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/authMiddleware");
const {
  createInvoice,
  myInvoices,
  landlordInvoices,
  markPaid,
  requestDelay,
  approveDelay,
} = require("../controllers/paymentController");

// Tenant
router.get("/tenant", authenticate, requireRole(["tenant"]), myInvoices);
router.post(
  "/invoice/:id/paid",
  authenticate,
  requireRole(["tenant"]),
  markPaid
);
router.post(
  "/invoice/:id/delay",
  authenticate,
  requireRole(["tenant"]),
  requestDelay
);

// Landlord
router.get(
  "/landlord",
  authenticate,
  requireRole(["landlord"]),
  landlordInvoices
);
router.post("/invoice", authenticate, requireRole(["landlord"]), createInvoice);
router.post(
  "/invoice/:id/approve-delay",
  authenticate,
  requireRole(["landlord"]),
  approveDelay
);

module.exports = router;
