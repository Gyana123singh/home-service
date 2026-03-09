const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");

const {
  getAllWithdrawRequests,
  approveWithdraw,
  rejectWithdraw,
} = require("../../controllers/admin/withdrawController");

// ================= GET ALL WITHDRAW REQUESTS =================
// GET /api/admin/withdraw
router.get("/", protect, isAdmin, getAllWithdrawRequests);

// ================= APPROVE WITHDRAW =================
// PUT /api/admin/withdraw/approve/:id
router.put("/approve/:id", protect, isAdmin, approveWithdraw);

// ================= REJECT WITHDRAW =================
// PUT /api/admin/withdraw/reject/:id
router.put("/reject/:id", protect, isAdmin, rejectWithdraw);

module.exports = router;
