const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { isVendor } = require("../../middleware/role.middleware");
const serviceController = require("../../controllers/vendor/serviceController");

router.post("/create", protect, isVendor, serviceController.createService);
router.get("/get", protect, isVendor, serviceController.getMyServices);

module.exports = router;
