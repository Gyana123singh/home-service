const Coupon = require("../../models/Coupon");

// CREATE
exports.createCoupon = async (req, res) => {
  try {
    const exists = await Coupon.findOne({ code: req.body.code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: "Coupon exists" });
    }

    const coupon = await Coupon.create({
      ...req.body,
      code: req.body.code.toUpperCase(),
    });

    res.status(201).json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// LIST
exports.getCoupons = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const query = search
    ? { code: { $regex: search, $options: "i" } }
    : {};

  const coupons = await Coupon.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Coupon.countDocuments(query);

  res.json({ success: true, page: Number(page), limit: Number(limit), total, data: coupons });
};

// UPDATE
exports.updateCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json({ success: true, coupon });
};

// TOGGLE
exports.toggleCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  res.json({ success: true, coupon });
};

// DELETE
exports.deleteCoupon = async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Coupon deleted" });
};