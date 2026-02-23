const express = require("express");
const router = express.Router();
const { isAdmin } = require("../../middleware/role.middleware");
const { protect } = require("../../middleware/auth.middleware");
const {
  getAllWithdrawRequests,
  approveWithdraw,
  rejectWithdraw,
} = require("../../controllers/admin/withdrawController");

router.get("/", protect, isAdmin, getAllWithdrawRequests);
router.put("/approve/:id", protect, isAdmin, approveWithdraw);
router.put("/reject/:id", protect, isAdmin, rejectWithdraw);

module.exports = router;
