// routes/customerRoutes.js
const router = require("express").Router();
const customerController = require("../controllers/customerController");

router.get("/options/:categoryId", customerController.getServiceOptions);

module.exports = router;
