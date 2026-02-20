const ServiceCategory = require("../../models/ServiceCategory");
const Service = require("../../models/AdminService");

// Get services by category (STRING-based)

// GET /api/services/by-category/:categoryId
exports.getServicesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const services = await Service.find({
      category: categoryId,
      status: "active",
      approvedByAdmin: true,
    })

      .select(
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
    const { id } = req.params;

    const service = await Service.findOne({
      _id: id,
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
