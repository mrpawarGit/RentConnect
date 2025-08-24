// backend/routes/tenant.js
const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/authMiddleware");
const Property = require("../models/Property"); // Add this import
const MaintenanceRequest = require("../models/MaintenanceRequest"); // Add this import
const RentInvoice = require("../models/RentInvoice"); // Add this import

router.get(
  "/dashboard",
  authenticate,
  requireRole ? requireRole(["tenant"]) : (req, _res, next) => next(),
  async (req, res) => {
    try {
      const userId = req.user?.id || null;

      // Get properties where this tenant is assigned
      const properties = await Property.find({ tenants: userId })
        .populate("landlord", "name email")
        .lean();

      // Get recent maintenance requests
      const recentRequests = await MaintenanceRequest.find({ tenant: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("property", "title address")
        .lean();

      // Get recent invoices
      const recentInvoices = await RentInvoice.find({ tenant: userId })
        .sort({ dueDate: -1 })
        .limit(5)
        .populate("property", "title address")
        .lean();

      // Calculate stats
      const pendingRequests = recentRequests.filter(
        (r) => r.status === "pending"
      ).length;
      const inProgressRequests = recentRequests.filter(
        (r) => r.status === "in_progress"
      ).length;
      const overdueInvoices = recentInvoices.filter(
        (i) => i.status === "overdue"
      ).length;

      res.json({
        ok: true,
        userId,
        stats: {
          pendingRequests,
          inProgressRequests,
          overdueInvoices,
        },
        properties,
        recentRequests,
        recentInvoices,
        notices: [],
      });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  }
);

module.exports = router;
