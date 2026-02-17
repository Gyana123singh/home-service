const User = require("../../models/User");
const KycAuditLog = require("../../models/VendorKycAuditLog");

exports.approveRejectVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { action, reason } = req.body; // approve | reject

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const vendor = await User.findById(vendorId);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.vendorStatus = action === "approve" ? "approved" : "rejected";
    await vendor.save();

    await KycAuditLog.create({
      vendor: vendor._id,
      action: action === "approve" ? "approved" : "rejected",
      reason,
      actionBy: req.user._id,
    });

    res.json({
      success: true,
      message: `Vendor ${action}d successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//ADMIN VIEW KYC AUDIT LOGS
exports.getVendorKycLogs = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!vendorId) {
      return res.status(400).json({
        message: "Vendor ID is required",
      });
    }

    const logs = await KycAuditLog.find({ vendor: vendorId })
      .populate("actionBy", "firstName email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch KYC audit logs",
      error: error.message,
    });
  }
};
