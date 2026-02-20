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
    const provider = req.user._id; // ✅ logged in user
    const {
      title,
      slug,
      shortDescription,
      description,
      tags,
      category,
      durationMinutes,
      membersRequired,
      maxQuantity,
      priceType,
      taxId,
      price,
      discountedPrice,
      isCancelable,
      payLaterAllowed,
      atStore,
      atDoorstep,
      approvedByAdmin,
      status,
      faqs,
      metaTitle,
      metaKeywords,
      metaDescription,
      schemaMarkup,
      requirements, // 🆕
    } = req.body;

    if (
      !title ||
      !slug ||
      !shortDescription ||
      !category ||
      !price
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Required fields missing" });
    }

    // Parse FAQs safely
    let parsedFaqs = [];
    if (faqs) {
      try {
        parsedFaqs = JSON.parse(faqs);
      } catch {
        return res
          .status(400)
          .json({ success: false, message: "Invalid FAQs format" });
      }
    }

    // Parse Requirements safely
    let parsedRequirements = [];
    if (requirements) {
      try {
        parsedRequirements =
          typeof requirements === "string"
            ? JSON.parse(requirements)
            : requirements;
      } catch {
        return res
          .status(400)
          .json({ success: false, message: "Invalid requirements format" });
      }
    }

    // Images (same as your existing code)
    const mainImage = req.files?.mainImage
      ? (await uploadToCloudinary(req.files.mainImage[0], "services/main"))
          .secure_url
      : "";

    const otherImages = [];
    if (req.files?.otherImages) {
      for (const file of req.files.otherImages) {
        const uploaded = await uploadToCloudinary(file, "services/other");
        otherImages.push(uploaded.secure_url);
      }
    }

    const files = [];
    if (req.files?.files) {
      for (const file of req.files.files) {
        const uploaded = await uploadToCloudinary(file, "services/files");
        files.push(uploaded.secure_url);
      }
    }

    const metaImage = req.files?.metaImage
      ? (await uploadToCloudinary(req.files.metaImage[0], "services/seo"))
          .secure_url
      : "";

    const service = await Service.create({
      title,
      slug,
      shortDescription,
      description,
      tags: tags ? tags.split(",") : [],
      provider,
      category,
      durationMinutes,
      membersRequired,
      maxQuantity,
      category, // ✅ string like "Painting"
      priceType,
      taxId,
      price,
      discountedPrice,

      requirements: parsedRequirements, // 🆕 SAVE UI REQUIREMENTS

      images: {
        main: mainImage,
        other: otherImages,
        files,
      },

      isCancelable: isCancelable === "true",
      payLaterAllowed: payLaterAllowed === "true",
      atStore: atStore === "true",
      atDoorstep: atDoorstep === "true",
      approvedByAdmin: approvedByAdmin === "true",
      status: status === "active" ? "active" : "inactive",

      faqs: parsedFaqs,

      seo: {
        metaTitle,
        metaKeywords: metaKeywords ? metaKeywords.split(",") : [],
        metaDescription,
        schemaMarkup,
        metaImage,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      serviceId: service._id,
    });
  } catch (error) {
    console.error("CREATE SERVICE ERROR:", error);

    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Service slug already exists" });
    }

    return res.status(500).json({ success: false, message: error.message });
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
      .populate("category", "name")
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
