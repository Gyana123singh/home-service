const Cart = require("../../models/Cart");
const Service = require("../../models/AdminService");
const Order = require("../../models/Order");
const Booking = require("../../models/Booking");
const { calculateServicePrice } = require("../../utils/calculateServicePrice");
const { creditVendor } = require("../../utils/walletService");

exports.addServiceToCart = async (req, res) => {
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

exports.checkOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentMethod, address } = req.body;

    if (!paymentMethod || !address) {
      return res.status(400).json({
        success: false,
        message: "Payment method and address required",
      });
    }

    const cartItems = await Cart.find({ user: userId }).populate("service");

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // 💰 Calculate totals
    let subTotal = 0;

    cartItems.forEach((item) => {
      subTotal += item.totalPrice * item.quantity;
    });

    const tax = subTotal * 0.18; // 18% GST
    const grandTotal = subTotal + tax;

    // ⚠️ For now: assume single-vendor per order
    const vendorId = cartItems[0].service.provider;

    // 🧾 Create Order
    const order = await Order.create({
      customer: userId,
      vendor: vendorId,
      items: cartItems.map((item) => ({
        service: item.service._id,
        selections: item.selections,
        date: item.date,
        basePrice: item.basePrice,
        addonsPrice: item.addonsPrice,
        totalPrice: item.totalPrice,
        quantity: item.quantity,
      })),
      address,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "pending" : "paid",
      subTotal,
      tax,
      grandTotal,
    });

    // ✅ If payment is successful (simulate)
    if (paymentMethod !== "COD") {
      // 1️⃣ Create Booking(s)
      for (const item of cartItems) {
        await Booking.create({
          customer: userId,
          vendor: vendorId,
          service: item.service._id,
          category: item.service.category, // ✅ IMPORTANT
          date: item.date,
          selections: item.selections,
          basePrice: item.basePrice,
          totalPrice: item.totalPrice,
          status: "upcoming",
        });
      }

      // 2️⃣ Credit Vendor Wallet
      await creditVendor(vendorId, subTotal);

      // 3️⃣ Clear Cart
      await Cart.deleteMany({ user: userId });

      // 4️⃣ Update Order
      order.paymentStatus = "paid";
      order.status = "confirmed";
      await order.save();
    }

    res.json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
