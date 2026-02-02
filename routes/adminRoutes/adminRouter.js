const router = require("express").Router();
const adminAuth = require("../../controllers/admin/adminController");
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");

router.post("/login", adminAuth.adminLogin);

module.exports = router;
