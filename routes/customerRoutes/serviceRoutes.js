// routes/customerRoutes.js
const router = require("express").Router();
const customerController = require("../../controllers/customer/serviceController");

router.get("/categories", customerController.getCategories);
router.get("/categories/:categoryId", customerController.getServicesByCategory);
// router.get("/categories", customerController.getCategories);

module.exports = router;
