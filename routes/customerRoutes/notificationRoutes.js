const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} = require("../../controllers/vendor/notificationController");

const { protect } = require("../../middleware/auth.middleware");

// Customer routes (uses the generic controller since it queries recipient from req.user._id)
router.get("/", protect, getMyNotifications);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);

module.exports = router;
