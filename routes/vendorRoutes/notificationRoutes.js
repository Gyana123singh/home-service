const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} = require("../../controllers/vendor/notificationController");

const { protect } = require("../../middleware/auth.middleware");
const { isVendor } = require("../../middleware/role.middleware");

router.get("/", protect, isVendor, getMyNotifications);
router.patch("/read-all", protect, isVendor, markAllAsRead);
router.patch("/:id/read", protect, isVendor, markAsRead);

module.exports = router;
