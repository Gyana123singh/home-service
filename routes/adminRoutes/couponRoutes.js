const express = require("express");
const router = express.Router();
const {
  createCoupon,
  getCoupons,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
} = require("../../controllers/admin/couponController");

// add protect + admin middleware here
router.post("/", createCoupon);
router.get("/", getCoupons);
router.put("/:id", updateCoupon);
router.patch("/:id/toggle", toggleCoupon);
router.delete("/:id", deleteCoupon);

module.exports = router;