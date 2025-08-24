const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/authMiddleware");
const {
  openThread,
  myThreads,
  getMessages,
  markRead,
} = require("../controllers/chatController");

router.post(
  "/thread",
  authenticate,
  requireRole(["tenant", "landlord"]),
  openThread
);
router.get(
  "/threads",
  authenticate,
  requireRole(["tenant", "landlord"]),
  myThreads
);
router.get(
  "/threads/:id/messages",
  authenticate,
  requireRole(["tenant", "landlord"]),
  getMessages
);
router.post(
  "/threads/:id/read",
  authenticate,
  requireRole(["tenant", "landlord"]),
  markRead
);

module.exports = router;
