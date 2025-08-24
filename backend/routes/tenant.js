// backend/routes/tenant.js
const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/authMiddleware");

// Minimal tenant dashboard endpoint to unblock UI.
// Expand later with real data (requests, invoices, properties).
router.get(
  "/dashboard",
  authenticate,
  requireRole ? requireRole(["tenant"]) : (req, _res, next) => next(),
  async (req, res) => {
    try {
      const userId = req.user?.id || null;

      // TODO: pull real data from your models
      // e.g., const recentRequests = await MaintenanceRequest.find({ tenantId: userId }).sort({ createdAt: -1 }).limit(10);
      // e.g., const invoices = await RentInvoice.find({ tenantId: userId }).sort({ dueDate: 1 }).limit(6);

      res.json({
        ok: true,
        userId,
        stats: {
          pendingRequests: 0,
          inProgressRequests: 0,
          overdueInvoices: 0,
        },
        recentRequests: [],
        recentInvoices: [],
        notices: [],
      });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  }
);

module.exports = router;
