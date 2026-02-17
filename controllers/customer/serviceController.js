const ServiceCategory = require("../../models/AdminServiceCategory");
const Service = require("../../models/AdminService");

// Get active categories
// exports.getCategories = async (req, res) => {
//   try {
//     const categories = await ServiceCategory.find({ status: true });

//     return res.json({
//       success: true,
//       categories,
//     });
//   } catch (error) {
//     console.error("GET CATEGORIES ERROR:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch categories",
//     });
//   }
// };

// Get services by category (STRING-based)

exports.getServicesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    const services = await Service.find({
      category: categoryId, // e.g. "Painting", "Cleaning", "AC Repair"
      status: "active",
    });

    return res.json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("GET SERVICES BY CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch services for this category",
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
