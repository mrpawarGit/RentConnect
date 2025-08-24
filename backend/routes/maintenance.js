const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { authenticate, requireRole } = require("../middleware/authMiddleware");
const {
  createRequest,
  myRequests,
  landlordRequests,
  updateStatus,
} = require("../controllers/maintenanceController");

// simple disk storage
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Tenant
router.post(
  "/",
  authenticate,
  requireRole(["tenant"]),
  upload.array("files", 5),
  createRequest
);
router.get("/mine", authenticate, requireRole(["tenant"]), myRequests);

// Landlord
router.get(
  "/landlord",
  authenticate,
  requireRole(["landlord"]),
  landlordRequests
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole(["landlord"]),
  updateStatus
);

module.exports = router;
