const ServiceCategory = require("../../models/ServiceCategory");
const ServiceSubCategory = require("../../models/ServiceSubCategory");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");

/**
 * =========================
 * CREATE CATEGORY
 * =========================
 */
exports.createCategory = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const {
      name,
      slug,
      addCategory,
      subCategory, // 👈 added
      darkColor,
      lightColor,
      status,
      metaTitle,
      metaDescription,
      metaKeywords,
      schemaMarkup,
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Name and slug are required",
      });
    }

    // Check slug uniqueness
    const existing = await ServiceCategory.findOne({ slug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists",
      });
    }

    // Image required
    if (!req.files || !req.files.image || !req.files.image[0]) {
      return res.status(400).json({
        success: false,
        message: "Category image is required",
      });
    }

    // Upload main image
    const imageUpload = await uploadToCloudinary(
      req.files.image[0],
      "categories/image",
    );

    const image = imageUpload.secure_url;

    // Upload meta image (optional)
    let metaImage = "";
    if (req.files.metaImage && req.files.metaImage[0]) {
      const metaUpload = await uploadToCloudinary(
        req.files.metaImage[0],
        "categories/seo",
      );
      metaImage = metaUpload.secure_url;
    }

    // ✅ Parse subcategories from frontend
    let parsedSubCategories = [];

    if (subCategory) {
      const subArray = JSON.parse(subCategory); // frontend sends JSON string

      parsedSubCategories = subArray
        .filter((sub) => sub && sub.trim() !== "")
        .map((sub) => ({
          name: sub,
          slug: sub
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, ""),
        }));
    }

    // Save to DB
    const category = await ServiceCategory.create({
      name,
      slug,
      addCategory,
      subCategory: parsedSubCategories, // 👈 store here
      darkColor,
      lightColor,
      status: status === "true" || status === true,
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
    return res.status(500).json({
      success: false,
      message: "Server error while creating category",
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

/**
 * =========================
 * EDIT CATEGORY
 * =========================
 */
exports.editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      addCategory,
      subCategory,
      darkColor,
      lightColor,
      status,
      metaTitle,
      metaDescription,
      metaKeywords,
      schemaMarkup,
    } = req.body;

    const category = await ServiceCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check slug uniqueness if changed
    if (slug && slug !== category.slug) {
      const existing = await ServiceCategory.findOne({ slug });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Slug already exists",
        });
      }
      category.slug = slug;
    }

    if (name) category.name = name;
    if (addCategory !== undefined) category.addCategory = addCategory;
    if (darkColor !== undefined) category.darkColor = darkColor;
    if (lightColor !== undefined) category.lightColor = lightColor;
    if (status !== undefined) {
      category.status = status === "true" || status === true;
    }

    // Upload main image (optional in edit)
    if (req.files && req.files.image && req.files.image[0]) {
      const imageUpload = await uploadToCloudinary(
        req.files.image[0],
        "categories/image",
      );
      category.image = imageUpload.secure_url;
    }

    // Upload meta image (optional)
    if (req.files && req.files.metaImage && req.files.metaImage[0]) {
      const metaUpload = await uploadToCloudinary(
        req.files.metaImage[0],
        "categories/seo",
      );
      if (!category.seo) category.seo = {};
      category.seo.metaImage = metaUpload.secure_url;
    }

    // Parse subcategories from frontend if provided
    if (subCategory !== undefined) {
      let parsedSubCategories = [];
      const subArray = typeof subCategory === "string" ? JSON.parse(subCategory) : subCategory;
      if (Array.isArray(subArray)) {
        parsedSubCategories = subArray
          .filter((sub) => sub && sub.trim() !== "")
          .map((sub) => ({
            name: sub,
            slug: sub
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]+/g, ""),
          }));
        category.subCategory = parsedSubCategories;
      }
    }

    // SEO updates
    if (metaTitle !== undefined || metaDescription !== undefined || schemaMarkup !== undefined || metaKeywords !== undefined) {
      if (!category.seo) {
        category.seo = {};
      }
      if (metaTitle !== undefined) category.seo.metaTitle = metaTitle;
      if (metaDescription !== undefined) category.seo.metaDescription = metaDescription;
      if (schemaMarkup !== undefined) category.seo.schemaMarkup = schemaMarkup;

      if (metaKeywords !== undefined) {
        category.seo.metaKeywords = typeof metaKeywords === "string"
          ? metaKeywords.split(",").map((k) => k.trim()).filter(Boolean)
          : metaKeywords;
      }
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("EDIT CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating category",
    });
  }
};

/**
 * =========================
 * DELETE CATEGORY
 * =========================
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await ServiceCategory.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Cascade delete subcategories associated with this category
    await ServiceSubCategory.deleteMany({ parentCategory: id });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting category",
    });
  }
};

