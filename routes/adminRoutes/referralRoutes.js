const router = require("express").Router();
const {
  getReferralLeaderboard,
  getReferralDashboardStats,
} = require("../../controllers/admin/referralDashboardController");
const { protect } = require("../../middleware/auth.middleware");

router.get("/leaderboard", protect, getReferralLeaderboard);
router.get("/stats", protect, getReferralDashboardStats);

module.exports = router;
