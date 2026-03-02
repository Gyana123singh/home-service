const Service = require("../../models/AdminService");
const ServiceCategory = require("../../models/ServiceCategory");


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

exports.getRequirementsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const data = await Service.findOne({ category });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No requirements found for this category",
      });
    }

    return res.json({
      success: true,
      data: data.requirements,
    });
  } catch (error) {
    console.error("GET REQUIREMENTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// =========================
// CREATE SERVICE (VENDOR)
// =========================
exports.createService = async (req, res) => {
  try {
    const vendorId = req.user._id;

    const {
      name,
      description,
      section,
      category,
      days,
      startTime,
      endTime,
      address,
      requirements,
      isActive,
      image,
      gender,
    } = req.body;

    // ================= VALIDATION =================
    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, description and category are required",
      });
    }

    // ================= REQUIREMENTS FORMAT =================
    const parsedRequirements = Array.isArray(requirements)
      ? requirements.map((r) => ({
          label: r.label,
          options: (r.options || []).map((o) => ({
            label: o.label,
            extraPrice: Number(o.price || o.extraPrice || 0),
          })),
        }))
      : [];

    // ================= GENDER VALIDATION =================
    let allowedGender = null;

    if (gender) {
      const validGenders = ["Male", "Female", "Both"];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender value",
        });
      }
      allowedGender = gender;
    }

    // ================= CREATE SERVICE =================
    const service = await Service.create({
      title: name,
      slug: name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      shortDescription: description.substring(0, 120),
      description,
      provider: vendorId,
      section,
      category,
      gender: allowedGender,
      days: Array.isArray(days) ? days : [],
      startTime: startTime || "",
      endTime: endTime || "",
      address: address || "",
      requirements: parsedRequirements,
      images: {
        main: image || "",
        other: [],
        files: [],
      },
      status: isActive ? "active" : "inactive",
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    });
  } catch (error) {
    console.error("CREATE SERVICE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getVendorServices = async (req, res) => {
  try {
    const vendorId = req.user._id;

    const services = await Service.find({ provider: vendorId })
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("GET SERVICES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// UPDATE SERVICE (VENDOR)
// =========================
exports.updateService = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { id } = req.params;

    const service = await Service.findOne({
      _id: id,
      provider: vendorId, // 🔐 ensures only own service
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or unauthorized",
      });
    }

    const {
      name,
      description,
      section,
      category,
      days,
      startTime,
      endTime,
      address,
      requirements,
      isActive,
      image,
      gender,
    } = req.body;

    // ================= UPDATE BASIC FIELDS =================
    if (name) {
      service.title = name;
      service.slug = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    }

    if (description) {
      service.description = description;
      service.shortDescription = description.substring(0, 120);
    }

    if (category) service.category = category;
    if (section) service.section = section;

    // ================= GENDER VALIDATION =================
    if (gender) {
      const validGenders = ["Male", "Female", "Both"];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender value",
        });
      }
      service.gender = gender;
    }

    // ================= OTHER FIELDS =================
    if (Array.isArray(days)) {
      service.days = days;
    }

    if (startTime !== undefined) {
      service.startTime = startTime;
    }

    if (endTime !== undefined) {
      service.endTime = endTime;
    }

    if (address !== undefined) {
      service.address = address;
    }

    // ================= REQUIREMENTS FORMAT =================
    if (requirements) {
      service.requirements = Array.isArray(requirements)
        ? requirements.map((r) => ({
            label: r.label,
            options: (r.options || []).map((o) => ({
              label: o.label,
              extraPrice: Number(o.price || o.extraPrice || 0),
            })),
          }))
        : service.requirements;
    }

    if (image) {
      service.images.main = image;
    }

    // ================= STATUS =================
    if (typeof isActive !== "undefined") {
      service.status = isActive ? "active" : "inactive";
    }

    await service.save();

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  } catch (error) {
    console.error("UPDATE SERVICE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// DELETE SERVICE (VENDOR)
// =========================
exports.deleteService = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { id } = req.params;

    const service = await Service.findOneAndDelete({
      _id: id,
      provider: vendorId, // 🔐 prevents deleting others
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("DELETE SERVICE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
