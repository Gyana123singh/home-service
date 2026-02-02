// controllers/admin/service.controller.js
const Service = require("../../models/adminModel/Service");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");

/**
 * =========================
 * CREATE SERVICE
 * =========================
 */
exports.createService = async (req, res) => {
  try {
    const {
      title,
      slug,
      shortDescription,
      description,
      tags,

      provider,
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
    } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (
      !title ||
      !slug ||
      !shortDescription ||
      !provider ||
      !category ||
      !price
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    /* ---------------- SAFE FAQ PARSE ---------------- */
    let parsedFaqs = [];
    if (faqs) {
      try {
        parsedFaqs = JSON.parse(faqs);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid FAQs format",
        });
      }
    }

    /* ---------------- IMAGE UPLOADS ---------------- */
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

    /* ---------------- CREATE SERVICE ---------------- */
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

      priceType,
      taxId,
      price,
      discountedPrice,

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

    // duplicate slug handling
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Service slug already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =========================
 * GET SERVICES (LIST)
 * =========================
 */
exports.getServices = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const services = await Service.find()
      .populate("provider", "firstName")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Service.countDocuments();

    return res.json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      data: services,
    });
  } catch (error) {
    console.error("GET SERVICES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
