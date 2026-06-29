const express = require("express");
const router = express.Router();
const { getUnifiedTransactions } = require("../../controllers/admin/transactionController");
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");

router.get("/", protect, isAdmin, getUnifiedTransactions);

module.exports = router;
