// controllers/admin/service.controller.js
const Service = require("../../models/AdminService");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");
const ServiceOption = require("../../models/AdminServiceOption");

/**
 * =========================
 * CREATE SERVICE
 * =========================
 */
exports.createService = async (req, res) => {
  try {
    const provider = req.user._id;
    const { title, category, requirements } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: "Title and category are required",
      });
    }

    const service = await Service.create({
      title,
      category,
      provider,
      requirements, // snapshot from frontend
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      serviceId: service._id,
    });
  } catch (error) {
    console.error("CREATE SERVICE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =========================
 * GET SERVICES (ADMIN)
 * =========================
 */
exports.getServicesAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      approvedByAdmin,
      category,
      provider,
    } = req.query;

    // 🔎 Build filter
    const filter = {};

    if (status) {
      filter.status = status; // active | inactive
    }

    if (approvedByAdmin !== undefined) {
      filter.approvedByAdmin = approvedByAdmin === "true";
    }

    if (category) {
      filter.category = category;
    }

    if (provider) {
      filter.provider = provider;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const services = await Service.find(filter)
      .populate("provider", "firstName email")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Service.countDocuments(filter);

    return res.json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      data: services,
    });
  } catch (error) {
    console.error("GET SERVICES ADMIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ➕ Create option (Admin)
exports.createOption = async (req, res) => {
  const { category, type, label, extraPrice } = req.body;

  const option = await ServiceOption.create({
    category,
    type, // bedrooms | cleaning_type | frequency
    label,
    extraPrice,
  });

  res.json({ success: true, option });
};

// 📄 Get options for a category
exports.getOptionsByCategory = async (req, res) => {
  const { categoryId } = req.params;

  const options = await ServiceOption.find({
    category: categoryId,
    isActive: true,
  });

  res.json({ success: true, options });
};

// ❌ Disable option
exports.toggleOption = async (req, res) => {
  const option = await ServiceOption.findById(req.params.id);
  option.isActive = !option.isActive;
  await option.save();

  res.json({ success: true, option });
};
