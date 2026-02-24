const Cart = require("../../models/Cart");
const Service = require("../../models/AdminService");
const Order = require("../../models/Order");
const Booking = require("../../models/Booking");
const Payment = require("../../models/Payment");
const { calculateServicePrice } = require("../../utils/calculateServicePrice");
const { creditVendor } = require("../../utils/walletService");
const { createStripeCheckoutSession } = require("../../utils/stripe");
const Coupon = require("../../models/Coupon");
const CouponUsage = require("../../models/CouponUsage");

// ======================= ADD TO CART =======================
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
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
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

    return res.json({
      success: true,
      message: "Added to cart",
      data: cartItem,
    });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================= GET CART =======================
exports.getMyCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cartItems = await Cart.find({ user: userId }).populate("service");
    res.json({ success: true, data: cartItems });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================= REMOVE FROM CART =======================
exports.removeFromCart = async (req, res) => {
  try {
    await Cart.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: "Removed from cart" });
  } catch (err) {
    console.error("Remove from cart error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================= UPDATE QUANTITY =======================
exports.updateQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Quantity must be at least 1" });
    }

    const item = await Cart.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { quantity },
      { new: true },
    );

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }

    res.json({ success: true, data: item });
  } catch (err) {
    console.error("Update quantity error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================= CHECKOUT =======================
// ======================= CHECKOUT =======================
exports.checkOut = async (req, res) => {
  try {
    // 🔐 Guard: user must be authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login again.",
      });
    }

    const io = req.app.get("io"); // may be undefined if socket not ready
    const userId = req.user._id;
    const { paymentMethod, address, couponCode } = req.body; // ✅ added couponCode

    if (!paymentMethod || !address) {
      return res.status(400).json({
        success: false,
        message: "Payment method and address required",
      });
    }

    if (!["COD", "STRIPE"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const cartItems = await Cart.find({ user: userId }).populate("service");

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // ✅ PROTECT AGAINST DELETED / BROKEN SERVICES
    const invalidItem = cartItems.find((item) => !item.service);
    if (invalidItem) {
      return res.status(400).json({
        success: false,
        message:
          "Some services in your cart are no longer available. Please refresh your cart.",
      });
    }

    // ✅ CALCULATE SUBTOTAL
    let subTotal = 0;
    cartItems.forEach((item) => {
      subTotal += item.totalPrice * item.quantity;
    });

    // ======================= APPLY COUPON =======================
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });

      if (!coupon) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid coupon code" });
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return res
          .status(400)
          .json({ success: false, message: "Coupon expired" });
      }

      if (subTotal < coupon.minOrderValue) {
        return res.status(400).json({
          success: false,
          message: "Order amount too low for this coupon",
        });
      }

      // Per-user limit check
      const usedByUser = await CouponUsage.countDocuments({
        user: userId,
        coupon: coupon._id,
      });

      if (usedByUser >= coupon.perUserLimit) {
        return res.status(400).json({
          success: false,
          message: "You have already used this coupon",
        });
      }

      // First order only check
      if (coupon.isFirstOrderOnly) {
        const orderCount = await Order.countDocuments({ customer: userId });
        if (orderCount > 0) {
          return res.status(400).json({
            success: false,
            message: "This coupon is only valid for first order",
          });
        }
      }

      // Calculate discount
      if (coupon.discountType === "percentage") {
        discount = (subTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      } else {
        discount = coupon.discountValue;
      }

      appliedCoupon = coupon;
    }

    // ======================= TOTALS =======================
    const discountedSubTotal = Math.max(subTotal - discount, 0);
    const tax = discountedSubTotal * 0.18;
    const grandTotal = discountedSubTotal + tax;

    // 🛡️ Guard: total must be valid
    if (!grandTotal || isNaN(grandTotal) || grandTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid total amount",
      });
    }

    // ✅ SAFE VENDOR ID
    const vendorId =
      cartItems[0].service.provider?._id || cartItems[0].service.provider;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "Vendor not found for this service",
      });
    }

    // ======================= CREATE ORDER =======================
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
      paymentStatus: "pending",
      subTotal,
      tax,
      grandTotal,
      status: "placed",
      coupon: appliedCoupon ? { code: appliedCoupon.code, discount } : null, // ✅ save coupon info
    });

    // ======================= SAVE COUPON USAGE =======================
    if (appliedCoupon) {
      await CouponUsage.create({
        user: userId,
        coupon: appliedCoupon._id,
        order: order._id,
      });

      appliedCoupon.usedCount += 1;
      await appliedCoupon.save();
    }

    // ======================= CREATE BOOKINGS =======================
    const bookings = [];
    for (const item of cartItems) {
      const booking = await Booking.create({
        customer: userId,
        vendor: vendorId,
        order: order._id,
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
        paymentStatus: "pending",
      });
      bookings.push(booking);
    }

    // ✅ CLEAR CART
    await Cart.deleteMany({ user: userId });

    // 🔔 REALTIME EVENTS (SAFE)
    io?.to("admin").emit("order:new", order);
    io?.to(`vendor:${vendorId}`).emit("booking:new", bookings);
    io?.to(`user:${userId}`).emit("order:update", order);
    io?.to(`vendor:${vendorId}`).emit("vendor:dashboard:update", {
      type: "new_booking",
    });

    // 🔒 ESCROW
    order.escrowAmount = paymentMethod === "COD" ? 0 : grandTotal;
    await order.save();

    // ======================= COD FLOW =======================
    if (paymentMethod === "COD") {
      return res.json({
        success: true,
        message: "Order placed with COD",
        data: { order, bookings },
      });
    }

    // ======================= STRIPE FLOW =======================
    if (paymentMethod === "STRIPE") {
      const payment = await Payment.create({
        order: order._id,
        customer: userId,
        vendor: vendorId,
        amount: grandTotal,
        method: "STRIPE",
        status: "initiated",
        gateway: "stripe",
      });

      const session = await createStripeCheckoutSession({
        amount: grandTotal,
        orderId: order._id,
        userId,
      });

      payment.stripeSessionId = session.id;
      await payment.save();

      return res.json({
        success: true,
        message: "Redirect to Stripe",
        paymentUrl: session.url,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid payment method",
    });
  } catch (err) {
    console.error("❌ Checkout error message:", err.message);
    console.error("❌ Checkout error stack:", err.stack);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


// ======================= MARK ORDER PAID =======================
exports.markOrderPaid = async (req, res) => {
  try {
    const io = req.app.get("io");
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.paymentStatus = "paid";
    order.status = "confirmed";
    await order.save();

    io?.to("admin").emit("order:update", order);
    io?.to(`user:${order.customer}`).emit("order:update", order);
    io?.to(`vendor:${order.vendor}`).emit("order:update", order);

    res.json({ success: true, data: order });
  } catch (err) {
    console.error("Mark order paid error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ======================= PREVIEW COUPON =======================
exports.previewCoupon = async (req, res) => {
  try {
    const userId = req.user._id;
    const { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({ success: false, message: "Coupon code required" });
    }

    const cartItems = await Cart.find({ user: userId }).populate("service");

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Calculate subtotal
    let subTotal = 0;
    cartItems.forEach((item) => {
      subTotal += item.totalPrice * item.quantity;
    });

    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(400).json({ success: false, message: "Invalid coupon" });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Coupon expired" });
    }

    if (subTotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: "Order amount too low for this coupon",
      });
    }

    // Per-user limit
    const usedByUser = await CouponUsage.countDocuments({
      user: userId,
      coupon: coupon._id,
    });

    if (usedByUser >= coupon.perUserLimit) {
      return res.status(400).json({
        success: false,
        message: "You already used this coupon",
      });
    }

    // First order check
    if (coupon.isFirstOrderOnly) {
      const orderCount = await Order.countDocuments({ customer: userId });
      if (orderCount > 0) {
        return res.status(400).json({
          success: false,
          message: "Only valid for first order",
        });
      }
    }

    // Calculate discount
    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount = (subTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    const discountedSubTotal = Math.max(subTotal - discount, 0);
    const tax = discountedSubTotal * 0.18;
    const grandTotal = discountedSubTotal + tax;

    return res.json({
      success: true,
      data: {
        coupon: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
        subTotal,
        discount,
        tax,
        grandTotal,
      },
    });
  } catch (err) {
    console.error("Preview coupon error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};