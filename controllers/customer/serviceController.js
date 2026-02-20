const Service = require("../../models/AdminService");
const ServiceCategory = require("../../models/ServiceCategory");

// GET /api/services/by-category/:categoryId
// GET /api/services/by-category/:categoryName

exports.getCategories = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { addCategory: { $regex: search, $options: "i" } },
      ],
    };

    const categories = await ServiceCategory.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await ServiceCategory.countDocuments(query);

    return res.json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      data: categories,
    });
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
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
