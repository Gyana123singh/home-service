const User = require("../../models/User");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");
const deleteFromCloudinary = require("../../utils/deleteFromCloudinary");
const KycAuditLog = require("../../models/VendorKycAuditLog");

// reupload documnet from vendor side
exports.reuploadDocuments = async (req, res) => {
  try {
    const vendor = await User.findById(req.user._id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const documents = vendor.documents || {};

    const uploadAndReplace = async (key, folder) => {
      if (!req.files?.[key]) return;

      // delete old doc
      if (documents[key]) {
        await deleteFromCloudinary(documents[key]);
      }

      // upload new doc
      const result = await uploadToCloudinary(req.files[key][0], folder);

      documents[key] = result.secure_url;
    };

    await uploadAndReplace("aadhaarImage", "vendors/aadhaar");
    await uploadAndReplace("panImage", "vendors/pan");
    await uploadAndReplace("passportPhoto", "vendors/passport");
    await uploadAndReplace("companyCertificate", "vendors/company");

    vendor.documents = documents;
    vendor.vendorStatus = "pending";
    await vendor.save();

    await KycAuditLog.create({
      vendor: vendor._id,
      action: "reuploaded",
      actionBy: vendor._id,
    });

    res.json({
      success: true,
      message: "Documents re-uploaded. Awaiting admin approval",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
