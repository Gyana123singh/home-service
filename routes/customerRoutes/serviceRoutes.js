// routes/customerRoutes.js
const router = require("express").Router();
const customerController = require("../../controllers/customer/serviceController");

router.get(
  "/by-category/:categoryId",
  customerController.getServicesByCategory,
);
router.get("/:serviceId", customerController.getServiceDetails);
// router.get("/categories", customerController.getCategories);

module.exports = router;
