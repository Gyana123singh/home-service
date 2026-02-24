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
router.post("/create-coupon", createCoupon);
router.get("/get-coupons", getCoupons);
router.put("/update-coupon/:id", updateCoupon);
router.patch("/:id/toggle", toggleCoupon);
router.delete("/delete-coupon/:id", deleteCoupon);

module.exports = router;