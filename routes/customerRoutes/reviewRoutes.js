const router = require("express").Router();
const reviewController = require("../../controllers/customer/reviewController");
const {protect} = require("../../middleware/auth.middleware");

router.post("/write-review", protect, reviewController.writeReview);
router.get("/get-reviews/:serviceId", reviewController.getServiceReviews);
router.get("/get-vendor-reviews/:vendorId", reviewController.getVendorReviews);

module.exports = router;
