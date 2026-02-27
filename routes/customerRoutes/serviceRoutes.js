// routes/customerRoutes.js
const router = require("express").Router();
const customerController = require("../../controllers/customer/serviceController");

router.get("/get-all-categories", customerController.getCategories);
router.get(
  "/by-category/:categoryId",
  customerController.getServicesByCategory,
);
// GET /api/services/special-offers
router.get("/special-offers", customerController.getSpecialOfferServices);
router.get("/get-service/:id", customerController.getServiceDetails);

module.exports = router;
