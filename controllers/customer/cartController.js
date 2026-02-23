const Cart = require("../../models/Cart");
const Service = require("../../models/AdminService");
const Order = require("../../models/Order");
const Booking = require("../../models/Booking");
const Payment = require("../../models/Payment");
const { calculateServicePrice } = require("../../utils/calculateServicePrice");
const { creditVendor } = require("../../utils/walletService");
const { createPhonePePayment } = require("../../utils/phonepe");

exports.addServiceToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { serviceId, selections, date, quantity } = req.body;

    if (!serviceId || !Array.isArray(selections) || !date) {
      return res.status(400).json({
        success: false,
        message: "serviceId, selections array and date are required",
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    for (const reqField of service.requirements) {
      const found = selections.find((s) => s.label === reqField.label);
      if (!found) {
        return res.status(400).json({
          success: false,
          message: `Please select ${reqField.label}`,
        });
      }
    }

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

    return res.json({ success: true, message: "Added to cart", data: cartItem });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getMyCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cartItems = await Cart.find({ user: userId }).populate("service");
    res.json({ success: true, data: cartItems });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    await Cart.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: "Removed from cart" });
  } catch (err) {
    console.error("Remove from cart error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const item = await Cart.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { quantity },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    res.json({ success: true, data: item });
  } catch (err) {
    console.error("Update quantity error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const io = req.app.get("io");
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

    let subTotal = 0;
    cartItems.forEach((item) => {
      subTotal += item.totalPrice * item.quantity;
    });

    const tax = subTotal * 0.18;
    const grandTotal = subTotal + tax;

    const vendorId = cartItems[0].service.provider;

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
      paymentStatus: paymentMethod === "COD" ? "pending" : "pending",
      subTotal,
      tax,
      grandTotal,
      status: "placed",
    });

    const bookings = [];
    for (const item of cartItems) {
      const booking = await Booking.create({
        customer: userId,
        vendor: vendorId,
        service: item.service._id,
        category: item.service.category,
        date: item.date,
        selections: item.selections,
        basePrice: item.basePrice,
        addonsPrice: item.addonsPrice,
        totalPrice: item.totalPrice,
        quantity: item.quantity,
        status: "upcoming",
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "pending" : "pending",
      });
      bookings.push(booking);
    }

    await Cart.deleteMany({ user: userId });

    io.to("admin").emit("order:new", order);
    io.to(`vendor:${vendorId}`).emit("booking:new", bookings);
    io.to(`user:${userId}`).emit("order:update", order);

    // 🔒 Escrow: hold full amount for online
    order.escrowAmount = paymentMethod === "COD" ? 0 : grandTotal;
    await order.save();

    // COD → finish
    if (paymentMethod === "COD") {
      return res.json({
        success: true,
        message: "Order placed with COD",
        data: { order, bookings },
      });
    }

    // Create Payment
    const merchantTransactionId = "TXN_" + Date.now();

    await Payment.create({
      order: order._id,
      customer: userId,
      vendor: vendorId,
      amount: grandTotal,
      method: paymentMethod,
      status: "initiated",
      gateway: "phonepe",
      phonepeMerchantTransactionId: merchantTransactionId,
    });

    const phonepeRes = await createPhonePePayment({
      amount: grandTotal,
      merchantTransactionId,
      userId,
    });

    return res.json({
      success: true,
      message: "Redirect to PhonePe",
      paymentUrl: phonepeRes.data.instrumentResponse.redirectInfo.url,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.completeBooking = async (req, res) => {
  try {
    const io = req.app.get("io");
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.status = "completed";

    if (booking.paymentMethod === "COD") {
      booking.paymentStatus = "paid";
    }

    await booking.save();

    const order = await Order.findOne({
      customer: booking.customer,
      vendor: booking.vendor,
    });

    // ONLINE → release full escrow
    if (booking.paymentMethod !== "COD" && order) {
      const payment = await Payment.findOne({ order: order._id });
      if (payment && payment.status === "held") {
        await creditVendor(order.vendor, order.escrowAmount);
        payment.status = "released";
        payment.releasedAt = new Date();
        await payment.save();
      }
    }

    // COD → credit full amount
    if (booking.paymentMethod === "COD" && order) {
      await creditVendor(order.vendor, order.grandTotal);
    }

    const pending = await Booking.find({
      customer: booking.customer,
      vendor: booking.vendor,
      status: { $ne: "completed" },
    });

    if (pending.length === 0 && order) {
      order.status = "completed";
      await order.save();

      io.to("admin").emit("order:update", order);
      io.to(`user:${order.customer}`).emit("order:update", order);
      io.to(`vendor:${order.vendor}`).emit("order:update", order);
    }

    io.to("admin").emit("booking:update", booking);
    io.to(`user:${booking.customer}`).emit("booking:update", booking);
    io.to(`vendor:${booking.vendor}`).emit("booking:update", booking);

    return res.json({
      success: true,
      message: "Booking completed and payment released",
      data: booking,
    });
  } catch (err) {
    console.error("Complete booking error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.markOrderPaid = async (req, res) => {
  try {
    const io = req.app.get("io");
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.paymentStatus = "paid";
    order.status = "confirmed";
    await order.save();

    io.to("admin").emit("order:update", order);
    io.to(`user:${order.customer}`).emit("order:update", order);
    io.to(`vendor:${order.vendor}`).emit("order:update", order);

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};