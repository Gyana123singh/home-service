const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth.middleware");
const { isVendor } = require("../../middleware/role.middleware");

const {
  requestWithdraw,
  getVendorWallet,
  getWalletTransactions,
} = require("../../controllers/vendor/withdrawController");

// ================= WALLET =================

// GET vendor wallet balance + recent transactions
// GET /api/vendor/wallet
router.get("/get-vendor-wallet", protect, isVendor, getVendorWallet);

// GET full transaction history
// GET /api/vendor/wallet/transactions
router.get("/get-vendor-wallet/transactions", protect, isVendor, getWalletTransactions);

// ================= WITHDRAW =================

// POST withdraw request
// POST /api/vendor/wallet/withdraw
router.post("/request/withdraw", protect, isVendor, requestWithdraw);

module.exports = router;
