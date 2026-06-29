const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { isAdmin } = require("../../middleware/role.middleware");
const vendorApprovalController = require("../../controllers/admin/vendorApprovalController");
const providerController = require("../../controllers/admin/providerController");

// Get all vendors (with filter)
router.get("/", protect, isAdmin, vendorApprovalController.getAllVendors);

// Get pending vendors
router.get("/pending", protect, isAdmin, vendorApprovalController.getPendingVendors);

// Approve vendor
router.put("/:vendorId/approve", protect, isAdmin, vendorApprovalController.approveVendor);

// Reject vendor
router.put("/:vendorId/reject", protect, isAdmin, vendorApprovalController.rejectVendor);

// Edit vendor
router.put("/:vendorId", protect, isAdmin, providerController.updateProvider);

// Delete vendor
router.delete("/:vendorId", protect, isAdmin, providerController.deleteProvider);

module.exports = router;