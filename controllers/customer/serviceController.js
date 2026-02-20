const Service = require("../../models/AdminService");

// GET /api/services/by-category/:categoryId
// GET /api/services/by-category/:categoryName
exports.getServicesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params; // e.g. "cleaning" or "AC-Repair" or "AC Repair"

    // Normalize: replace - and _ with space, trim
    const normalized = categoryId.replace(/[-_]/g, " ").trim();

    // Create case-insensitive regex
    const regex = new RegExp(`^${normalized}$`, "i");

    const services = await Service.find({
      category: regex, // ✅ case-insensitive match
      status: "active",
      approvedByAdmin: true,
    }).select(
      "title shortDescription price discountedPrice images requirements",
    );

    return res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("GET SERVICES BY CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =========================
 * GET CATEGORY LIST
 * =========================
 */

// GET /api/services/:id
exports.getServiceDetails = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findOne({
      _id: serviceId,
      status: "active",
      approvedByAdmin: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("GET SERVICE DETAILS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
