const Slider = require("../../models/AdminSlider");

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
