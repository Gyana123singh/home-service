// routes/customerRoutes.js
const router = require("express").Router();
const customerController = require("../../controllers/customer/serviceController");

router.get("/get-all-categories", customerController.getCategories);
router.get(
  "/by-category/:categoryId",
  customerController.getServicesByCategory,
);
router.get("/get-service/:serviceId", customerController.getServiceDetails);
// router.get("/categories", customerController.getCategories);

module.exports = router;
