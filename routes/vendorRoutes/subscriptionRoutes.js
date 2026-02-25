const express = require("express");
const router = express.Router();

const {
  getActivePlans,
  getMySubscription,
  createVendorSubscriptionCheckout,
  getMySubscriptionPayments,
} = require("../../controllers/vendor/subscriptionController");

const { protect } = require("../../middleware/auth.middleware");
const { isVendor } = require("../../middleware/role.middleware");

router.get("/plans", protect, isVendor, getActivePlans);
router.get("/my-subscription", protect, isVendor, getMySubscription);
router.post("/checkout", protect, isVendor, createVendorSubscriptionCheckout);
router.get("/my-payments", protect, isVendor, getMySubscriptionPayments);

module.exports = router;
