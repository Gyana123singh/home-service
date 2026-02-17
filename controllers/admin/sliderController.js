// controllers/admin/slider.controller.js
const Slider = require("../../models/AdminSlider");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");

/**
 * =========================
 * CREATE SLIDER (ADMIN)
 * =========================
 */
exports.createSlider = async (req, res) => {
  try {
    const { tag, title, offerText, buttonText, status } = req.body;

    if (!tag || !offerText) {
      return res.status(400).json({
        success: false,
        message: "Tag and Offer Text are required",
      });
    }

    const webImage = (
      await uploadToCloudinary(req.files.webImage[0], "sliders/web")
    ).secure_url;

    /* ---------- Create Slider ---------- */
    const slider = await Slider.create({
      type: "special_offer",
      tag,
      title: title || "Special Offer",
      offerText,
      buttonText: buttonText || "Book Now",
      webImage,
      status: status === "true" || status === true,
    });

    return res.status(201).json({
      success: true,
      message: "Special Offer slider created successfully",
      slider,
    });
  } catch (error) {
    console.error("CREATE SLIDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// controllers/admin/slider.controller.js
/**
 * =========================
 * GET SLIDERS (ADMIN)
 * =========================
 */
exports.getSliders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status === "active") query.status = true;
    if (status === "inactive") query.status = false;

    const sliders = await Slider.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Slider.countDocuments(query);

    return res.json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      data: sliders,
    });
  } catch (error) {
    console.error("GET SLIDERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =========================
 * GET ACTIVE SPECIAL OFFERS (APP)
 * =========================
 */
exports.getSpecialOffers = async (req, res) => {
  try {
    const sliders = await Slider.find({
      type: "special_offer",
      status: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: sliders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * =========================
 * TOGGLE SLIDER STATUS
 * =========================
 */
exports.toggleSliderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const slider = await Slider.findById(id);
    if (!slider) {
      return res.status(404).json({
        success: false,
        message: "Slider not found",
      });
    }

    slider.status = !slider.status; // ✅ toggle
    await slider.save(); // ✅ SAVE to DB

    return res.json({
      success: true,
      message: `Slider ${slider.status ? "activated" : "deactivated"} successfully`,
      data: slider,
    });
  } catch (error) {
    console.error("TOGGLE SLIDER STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
