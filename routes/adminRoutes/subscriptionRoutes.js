const express = require("express");
const router = express.Router();
const {
  createPlan,
  getAllPlans,
  updatePlan,
  deletePlan,
  getAllSubscriptionPayments,
} = require("../../controllers/admin/subscriptionController");

const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");

router.post("/", protect, isAdmin, createPlan);
router.get("/", protect, isAdmin, getAllPlans);
router.put("/:id", protect, isAdmin, updatePlan);
router.delete("/:id", protect, isAdmin, deletePlan);
// API to get “Cash Collections”
router.get("/", protect, isAdmin, getAllSubscriptionPayments);

module.exports = router;
