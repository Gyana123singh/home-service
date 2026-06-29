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

    // Check if the service already exists in the selected category (case-insensitive)
    const existingService = await Service.findOne({
      title: { $regex: new RegExp(`^${title.trim()}$`, "i") },
      category: category.trim(),
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: "A service with this title already exists in this category.",
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

/**
 * =========================
 * TOGGLE SERVICE STATUS
 * =========================
 */
exports.toggleServiceStatus = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    service.status = service.status === "active" ? "inactive" : "active";
    await service.save();
    return res.json({
      success: true,
      message: `Service marked as ${service.status}`,
      status: service.status,
    });
  } catch (error) {
    console.error("TOGGLE SERVICE STATUS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * =========================
 * DELETE SERVICE
 * =========================
 */
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    return res.json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    console.error("DELETE SERVICE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * =========================
 * GET SERVICE BY ID
 * =========================
 */
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    return res.json({ success: true, data: service });
  } catch (error) {
    console.error("GET SERVICE BY ID ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * =========================
 * UPDATE SERVICE
 * =========================
 */
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, requirements } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: "Title and category are required",
      });
    }

    // Check duplicate check (excluding the current service)
    const existingService = await Service.findOne({
      title: { $regex: new RegExp(`^${title.trim()}$`, "i") },
      category: category.trim(),
      _id: { $ne: id },
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: "A service with this title already exists in this category.",
      });
    }

    const service = await Service.findByIdAndUpdate(
      id,
      { title, category, requirements },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    return res.json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  } catch (error) {
    console.error("UPDATE SERVICE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
