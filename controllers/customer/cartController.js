const Cart = require("../../models/Cart");
const Service = require("../../models/AdminService");
const { calculateServicePrice } = require("../../utils/calculateServicePrice");

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware
    const { serviceId, selections, date, quantity } = req.body;

    if (!serviceId || !Array.isArray(selections) || !date) {
      return res.status(400).json({
        success: false,
        message: "serviceId, selections array and date are required",
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // ✅ Validate: all requirements selected
    for (const reqField of service.requirements) {
      const found = selections.find((s) => s.label === reqField.label);
      if (!found) {
        return res.status(400).json({
          success: false,
          message: `Please select ${reqField.label}`,
        });
      }
    }

    // 🧮 Calculate price securely
    const { basePrice, addonsPrice, totalPrice, breakdown } =
      calculateServicePrice(service, selections);

    const cartItem = await Cart.create({
      user: userId,
      service: service._id,
      selections: breakdown,
      date,
      basePrice,
      addonsPrice,
      totalPrice,
      quantity: quantity || 1,
    });

    return res.json({
      success: true,
      message: "Added to cart",
      data: cartItem,
    });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getMyCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cartItems = await Cart.find({ user: userId }).populate("service");

    res.json({
      success: true,
      data: cartItems,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.removeFromCart = async (req, res) => {
  await Cart.deleteOne({ _id: req.params.id, user: req.user._id });
  res.json({ success: true });
};

exports.updateQuantity = async (req, res) => {
  const { quantity } = req.body;
  const item = await Cart.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { quantity },
    { new: true },
  );
  res.json({ success: true, data: item });
};
