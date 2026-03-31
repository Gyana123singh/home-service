const VendorService = require("../../models/VendorService");
const ServiceCategory = require("../../models/ServiceCategory");
const {
  getActiveGlobalOffer,
  applyGlobalDiscount,
} = require("../../utils/globalOfferService");

// GET /api/services/by-category/:categoryId
// GET /api/services/by-category/:categoryName

exports.getCategories = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store"); // 🔥 ADD THIS
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
    res.set("Cache-Control", "no-store");

    const category = req.params.categoryId?.trim().toLowerCase();

    console.log("🔍 Category received:", category);

    const services = await VendorService.find({
      isActive: true,
      category: category, // ✅ STRICT MATCH (BEST)
    });

    console.log("✅ Services found:", services.length);

    return res.json({
      success: true,
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

exports.getSpecialOfferServices = async (req, res) => {
  try {
    const globalOffer = await getActiveGlobalOffer();

    if (!globalOffer) {
      return res.json({
        success: true,
        offerApplied: false,
        data: [],
      });
    }

    const services = await VendorService.find({
      isActive: true,
    }).limit(20);

    const updated = services
      .map((service) => {
        const { finalAmount, discountAmount } = applyGlobalDiscount(
          service.price,
          globalOffer,
        );

        return {
          ...service._doc,
          originalPrice: service.price,
          discountAmount,
          finalPrice: finalAmount,
          offerApplied: true,
          offerTitle: globalOffer.title,
          discountType: globalOffer.discountType,
          discountValue: globalOffer.discountValue,
        };
      })
      .filter((service) => service.discountAmount > 0);

    return res.json({
      success: true,
      offerApplied: true,
      data: updated,
    });
  } catch (error) {
    console.error("SPECIAL OFFER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getServiceDetails = async (req, res) => {
  try {
    const service = await VendorService.findById(req.params.id);

    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const globalOffer = await getActiveGlobalOffer();

    const { finalAmount, discountAmount } = applyGlobalDiscount(
      service.price,
      globalOffer,
    );

    return res.json({
      success: true,
      data: {
        ...service._doc,
        originalPrice: service.price,
        discountAmount,
        finalPrice: finalAmount,
        offerApplied: !!globalOffer,
      },
    });
  } catch (error) {
    console.error("GET SERVICE DETAILS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
