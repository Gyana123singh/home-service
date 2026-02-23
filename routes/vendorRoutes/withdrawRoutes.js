const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const {
  requestWithdraw,
  getMyWithdrawRequests,
} = require("../../controllers/vendor/vendorController");

router.post("/withdraw", protect, requestWithdraw);
router.get("/withdraw", protect, getMyWithdrawRequests);

module.exports = router;