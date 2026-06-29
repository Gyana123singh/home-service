const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");
const {
  getSettlements,
  settleProvider,
  getSettlementHistory,
  getCashCollections,
  collectCash,
  getCashCollectionList,
} = require("../../controllers/admin/settlementController");

// ================= Settlements =================
router.get("/settlement", protect, isAdmin, getSettlements);
router.post("/settlement", protect, isAdmin, settleProvider);
router.get("/settlement/history", protect, isAdmin, getSettlementHistory);

// ================= Cash Collections =================
router.get("/cash-collection", protect, isAdmin, getCashCollections);
router.post("/cash-collection", protect, isAdmin, collectCash);
router.get("/cash-collection/list", protect, isAdmin, getCashCollectionList);

module.exports = router;
