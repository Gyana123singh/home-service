// controllers/admin/slider.controller.js
const Slider = require("../../models/adminModel/Slider");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");

/**
 * =========================
 * CREATE SLIDER (ADMIN)
 * =========================
 */
exports.createSlider = async (req, res) => {
  try {
    const { type, category, provider, redirectUrl, status } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Slider type is required",
      });
    }

    if (!req.files?.appImage || !req.files?.webImage) {
      return res.status(400).json({
        success: false,
        message: "App image and Web image are required",
      });
    }

    /* ---------- Upload Images ---------- */
    const appImage = (
      await uploadToCloudinary(req.files.appImage[0], "sliders/app")
    ).secure_url;

    const webImage = (
      await uploadToCloudinary(req.files.webImage[0], "sliders/web")
    ).secure_url;

    /* ---------- Create Slider ---------- */
    const slider = await Slider.create({
      type,
      category: type === "category" ? category : null,
      provider: type === "provider" ? provider : null,
      redirectUrl: type === "url" ? redirectUrl : null,
      appImage,
      webImage,
      status: status === "true",
    });

    return res.status(201).json({
      success: true,
      message: "Slider created successfully",
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

/**
 * =========================
 * GET SLIDERS (ADMIN LIST)
 * =========================
 */
exports.getSliders = async (req, res) => {
  try {
    const {
      status, // active | deactive
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};
    if (status === "active") query.status = true;
    if (status === "deactive") query.status = false;

    const sliders = await Slider.find(query)
      .populate("category", "name")
      .populate("provider", "firstName")
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
