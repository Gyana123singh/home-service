const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const { isVendor } = require("../../middleware/role.middleware");
const {
  requestWithdraw,
  getMyWithdrawRequests,
} = require("../../controllers/vendor/withdrawController");

// POST /api/vendor/withdraw/request
router.post("/withdraw/request", protect, isVendor, requestWithdraw);

// GET /api/vendor/withdraw/my-requests
router.get("/withdraw/my-requests", protect, isVendor, getMyWithdrawRequests);

module.exports = router;
