// controllers/admin/category.controller.js
const ServiceCategory = require("../../models/adminModel/ServiceCategory");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");

/**
 * =========================
 * CREATE CATEGORY
 * =========================
 */
exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      slug,
      type,
      darkColor,
      lightColor,
      status,

      metaTitle,
      metaDescription,
      metaKeywords,
      schemaMarkup,
    } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!name || !slug || !darkColor || !lightColor) {
      return res.status(400).json({
        success: false,
        message: "Name, slug, dark color and light color are required",
      });
    }

    if (!req.files?.image) {
      return res.status(400).json({
        success: false,
        message: "Category image is required",
      });
    }

    /* ---------- IMAGE UPLOAD ---------- */
    const image = (
      await uploadToCloudinary(req.files.image[0], "categories/image")
    ).secure_url;

    const metaImage = req.files?.metaImage
      ? (await uploadToCloudinary(req.files.metaImage[0], "categories/seo"))
          .secure_url
      : "";

    /* ---------- CREATE CATEGORY ---------- */
    const category = await ServiceCategory.create({
      name,
      slug,
      type: type || "category",
      darkColor,
      lightColor,
      status: status === "true",

      image,

      seo: {
        metaTitle,
        metaDescription,
        metaKeywords: metaKeywords
          ? metaKeywords
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean)
          : [],
        schemaMarkup,
        metaImage,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category slug already exists",
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
 * GET CATEGORY LIST
 * =========================
 */
exports.getCategories = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
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
