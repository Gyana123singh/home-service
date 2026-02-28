const router = require("express").Router();
const reviewController = require("../../controllers/customer/reviewController");
const { protect } = require("../../middleware/auth.middleware");

router.post("/write", protect, reviewController.writeReview);
router.get("/service/:serviceId", reviewController.getServiceReviews);

module.exports = router;
