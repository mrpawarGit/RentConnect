// backend/routes/landlord.js
const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/authMiddleware");

// Minimal landlord dashboard endpoint to unblock UI.
// Replace stubs with real aggregates (properties, requests, invoices).
router.get(
  "/dashboard",
  authenticate,
  requireRole ? requireRole(["landlord"]) : (req, _res, next) => next(),
  async (req, res) => {
    try {
      const userId = req.user?.id || null;

      // TODO: pull real data from your models:
      // const props = await Property.find({ landlord: userId }).countDocuments();
      // const openRequests = await MaintenanceRequest.countDocuments({ landlord: userId, status: { $in: ["pending","in_progress"] }});
      // const overdueInvoices = await RentInvoice.countDocuments({ landlord: userId, status: "overdue" });

      res.json({
        ok: true,
        userId,
        stats: {
          properties: 0,
          openRequests: 0,
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
