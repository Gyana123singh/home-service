const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const { isVendor, isCustomer } = require("../middlewares/roleMiddleware");
const bookingController = require("../controllers/bookingController");

router.post("/create", protect, isCustomer, bookingController.createBooking);
router.get("/vendor", protect, isVendor, bookingController.vendorBookings);
router.post("/:id/accept", protect, isVendor, bookingController.acceptBooking);
router.post(
  "/:id/complete",
  protect,
  isVendor,
  bookingController.completeBooking,
);

module.exports = router;
