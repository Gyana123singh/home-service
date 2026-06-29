const router = require("express").Router();
const adminController = require("../../controllers/admin/adminController");
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");

router.post("/login", adminController.adminLogin);
router.get("/profile", protect, isAdmin, adminController.getAllCustomers);
router.get("/dashboard-stats", protect, isAdmin, adminController.getDashboardStats);
router.delete("/delete-customer/:id", protect, isAdmin, adminController.deleteCustomer);
router.put("/update-referral-settings", protect, isAdmin, adminController.updateReferralSettings);

module.exports = router;
