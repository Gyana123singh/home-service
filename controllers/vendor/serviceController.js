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
      serviceMode,
      price,
      discountPrice,
      days,
      startTime,
      endTime,
      address,
      requirements,
      isActive,
      image,
    } = req.body;

    if (!name || !description || !category || !price) {
      return res.status(400).json({
        success: false,
        message: "Name, description, category and price are required",
      });
    }

    const cleanPrice = Number(String(price).replace("$", ""));
    const cleanDiscount = discountPrice
      ? Number(String(discountPrice).replace("$", ""))
      : undefined;

    if (isNaN(cleanPrice)) {
      return res.status(400).json({
        success: false,
        message: "Invalid price value",
      });
    }

    const parsedRequirements = Array.isArray(requirements)
      ? requirements.map((r) => ({
          label: r.label,
          options: (r.options || []).map((o) => ({
            label: o.label,
            extraPrice: Number(o.price || o.extraPrice || 0),
          })),
        }))
      : [];

    const service = await Service.create({
      title: name,
      slug: name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      shortDescription: description.substring(0, 120),
      description,
      provider: vendorId,
      section,
      category,
      serviceMode,
      days: Array.isArray(days) ? days : [],
      startTime: startTime || "",
      endTime: endTime || "",
      address: address || "",
      price: cleanPrice,
      discountedPrice: cleanDiscount,
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
