const User = require("../../models/User");
const ProviderProfile = require("../../models/AdminProviderProfile");

// =========================
// GET ALL PENDING VENDORS
// =========================
exports.getPendingVendors = async (req, res) => {
  try {
    const vendors = await User.find({
      role: "vendor",
      vendorStatus: "pending",
      vendorOnboardingStep: "completed",
    })
      .select("-password +selfieImage +documents.aadhaarImage +documents.panImage +documents.passportPhoto +documents.companyCertificate")
      .lean();

    const formattedVendors = [];
    for (const vendor of vendors) {
      const profile = await ProviderProfile.findOne({ vendor: vendor._id }).lean();
      formattedVendors.push({
        ...vendor,
        profile: profile || null
      });
    }

    return res.json({
      success: true,
      count: formattedVendors.length,
      data: formattedVendors,
    });
  } catch (error) {
    console.error("GET PENDING VENDORS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =========================
// APPROVE VENDOR
// =========================
exports.approveVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await User.findById(vendorId);

    if (!vendor || vendor.role !== "vendor") {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    if (vendor.vendorStatus === "approved") {
      return res.status(400).json({ message: "Vendor already approved" });
    }

    vendor.vendorStatus = "approved";
    await vendor.save();

    return res.json({
      success: true,
      message: "Vendor approved successfully",
      vendorId: vendor._id,
    });
  } catch (error) {
    console.error("APPROVE VENDOR ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =========================
// REJECT VENDOR
// =========================
exports.rejectVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { reason } = req.body;

    const vendor = await User.findById(vendorId);

    if (!vendor || vendor.role !== "vendor") {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    vendor.vendorStatus = "rejected";
    vendor.rejectionReason = reason || "Not specified";
    await vendor.save();

    return res.json({
      success: true,
      message: "Vendor rejected",
      vendorId: vendor._id,
    });
  } catch (error) {
    console.error("REJECT VENDOR ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =========================
// GET ALL VENDORS (WITH FILTER)
// =========================
exports.getAllVendors = async (req, res) => {
  try {
    const { status } = req.query; // pending | approved | rejected | all

    const filter = { role: "vendor" };

    if (status && status !== "all") {
      filter.vendorStatus = status;
    }

    const vendors = await User.find(filter)
      .select("-password +selfieImage +documents.aadhaarImage +documents.panImage +documents.passportPhoto +documents.companyCertificate")
      .lean();

    const formattedVendors = [];
    for (const vendor of vendors) {
      const profile = await ProviderProfile.findOne({ vendor: vendor._id }).lean();
      formattedVendors.push({
        ...vendor,
        profile: profile || null
      });
    }

    return res.json({
      success: true,
      count: formattedVendors.length,
      data: formattedVendors,
    });
  } catch (error) {
    console.error("GET ALL VENDORS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};