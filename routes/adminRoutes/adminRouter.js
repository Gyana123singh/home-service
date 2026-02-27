const router = require("express").Router();
const adminController = require("../../controllers/admin/adminController");
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");

router.post("/login", adminController.adminLogin);
router.get("/profile", protect, isAdmin, adminController.getMyProfile);

module.exports = router;
