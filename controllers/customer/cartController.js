const Cart = require("../../models/Cart");
const Service = require("../../models/VendorService");
const Order = require("../../models/Order");
const Booking = require("../../models/Booking");
const Payment = require("../../models/Payment");
const { sendNotification } = require("../../utils/notification");
const { calculateServicePrice } = require("../../utils/calculateServicePrice");
const { createRazorpayCheckoutSession } = require("../../utils/razorpay");
const Coupon = require("../../models/Coupon");
const CouponUsage = require("../../models/CouponUsage");
const {
  getActiveGlobalOffer,
  applyGlobalDiscount,
} = require("../../utils/globalOfferService");

const ReferralSettings = require("../../models/ReferralSettings");
const User = require("../../models/User");
const Wallet = require("../../models/Wallet");
const Referral = require("../../models/Referral");
const mongoose = require("mongoose");
// ======================= ADD TO CART =======================

exports.addServiceToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { serviceId, selections = [], date, time, quantity = 1 } = req.body;

    if (!serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: "serviceId and date required",
      });
    }

    // ✅ Get service
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (!service.isActive) {
      return res.status(400).json({
        success: false,
        message: "Service is inactive",
      });
    }

    // ✅ Check vendor
    const vendor = await User.findById(service.vendor);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor",
      });
    }

    if (!vendor.isOnline) {
      return res.status(400).json({
        success: false,
        message: "Vendor is offline",
      });
    }

    // ✅ Calculate price
    const { basePrice, addonsPrice, totalPrice, breakdown } =
      calculateServicePrice(service, selections);

    const safeQuantity = quantity > 0 ? quantity : 1;

    const cartItem = await Cart.create({
      user: userId,
      service: service._id,
      selections: breakdown,
      date,
      time, // ✅ ADD THIS
      basePrice,
      addonsPrice,
      unitPrice: totalPrice,
      totalPrice: totalPrice * safeQuantity,
      quantity: safeQuantity,
    });

    return res.json({
      success: true,
      message: "Service added to cart",
      data: cartItem,
    });
  } catch (error) {
    console.error("ADD CART ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================= GET CART =======================
exports.getMyCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cartItems = await Cart.find({ user: userId }).populate({
      path: "service",
      populate: {
        path: "vendor",
        select: "firstName lastName isOnline role",
      },
    });

    const validCartItems = cartItems.filter((item) => {
      return (
        item.service &&
        item.service.vendor &&
        item.service.vendor.role === "vendor" &&
        item.service.vendor.isOnline === true
      );
    });

    return res.json({
      success: true,
      data: validCartItems,
    });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
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
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const item = await Cart.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    item.quantity = quantity;
    item.totalPrice = item.unitPrice * quantity; // ✅ FIX

    await item.save();

    res.json({
      success: true,
      data: item,
    });
  } catch (err) {
    console.error("Update quantity error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================= CHECKOUT =======================
exports.checkOut = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login again",
      });
    }

    const io = req.app.get("io");
    const userId = req.user._id;
    const { paymentMethod, address, couponCode } = req.body;

    if (!paymentMethod || !address) {
      return res.status(400).json({
        success: false,
        message: "Payment method and address required",
      });
    }

    if (!["COD", "RAZORPAY"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const cartItems = await Cart.find({ user: userId }).populate("service");

    if (!cartItems.length) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // ================= VALIDATE SERVICES =================
    const invalidItem = cartItems.find((item) => !item.service);

    if (invalidItem) {
      return res.status(400).json({
        success: false,
        message: "Some services are no longer available",
      });
    }

    // ================= VALIDATE VENDOR =================
    const vendorIds = [
      ...new Set(cartItems.map((i) => i.service.vendor.toString())),
    ];

    if (vendorIds.length > 1) {
      return res.status(400).json({
        success: false,
        message: "Cart cannot contain services from multiple vendors",
      });
    }

    const vendorId = vendorIds[0];

    const vendor = await User.findById(vendorId);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor",
      });
    }

    if (!vendor.isOnline) {
      return res.status(400).json({
        success: false,
        message: "Vendor is currently offline",
      });
    }

    // ================= CHECK TIME SLOT =================
    for (const item of cartItems) {
      if (item.time) {
        const existingBooking = await Booking.findOne({
          vendor: vendorId,
          date: item.date,
          time: item.time,
          status: { $in: ["upcoming", "confirmed", "awaiting"] },
        });

        if (existingBooking) {
          return res.status(400).json({
            success: false,
            message: `Time slot ${item.time} already booked`,
          });
        }
      }
    }

    // ================= CALCULATE TOTAL =================
    const globalOffer = await getActiveGlobalOffer();

    let subTotal = 0;
    let globalDiscountTotal = 0;

    for (const item of cartItems) {
      const itemTotal = item.unitPrice * item.quantity;

      const { finalAmount, discountAmount } = applyGlobalDiscount(
        itemTotal,
        globalOffer,
      );

      subTotal += finalAmount;
      globalDiscountTotal += discountAmount;
    }

    subTotal = Number(subTotal.toFixed(2));
    globalDiscountTotal = Number(globalDiscountTotal.toFixed(2));

    // ================= APPLY COUPON =================
    let couponDiscount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });

      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: "Invalid coupon code",
        });
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Coupon expired",
        });
      }

      if (subTotal < coupon.minOrderValue) {
        return res.status(400).json({
          success: false,
          message: "Order amount too low for this coupon",
        });
      }

      const usedByUser = await CouponUsage.countDocuments({
        user: userId,
        coupon: coupon._id,
      });

      if (usedByUser >= coupon.perUserLimit) {
        return res.status(400).json({
          success: false,
          message: "Coupon already used",
        });
      }

      if (coupon.discountType === "percentage") {
        couponDiscount = (subTotal * coupon.discountValue) / 100;

        if (coupon.maxDiscount) {
          couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
        }
      } else {
        couponDiscount = coupon.discountValue;
      }

      appliedCoupon = coupon;
    }

    couponDiscount = Number(couponDiscount.toFixed(2));

    const discountedSubTotal = Number(
      Math.max(subTotal - couponDiscount, 0).toFixed(2),
    );

    const tax = Number((discountedSubTotal * 0.18).toFixed(2));
    const grandTotal = Number((discountedSubTotal + tax).toFixed(2));

    // ================= CREATE ORDER =================
    const order = await Order.create({
      customer: userId,
      vendor: vendorId,
      escrowAmount: grandTotal,
      items: cartItems.map((item) => ({
        service: item.service._id,
        selections: item.selections,
        date: item.date,
        time: item.time || null,
        basePrice: item.basePrice,
        addonsPrice: item.addonsPrice,
        totalPrice: item.totalPrice,
        quantity: item.quantity,
      })),
      address,
      paymentMethod,
      paymentStatus: "pending",
      subTotal: discountedSubTotal,
      tax,
      grandTotal,
      status: "placed",
      globalDiscount: globalDiscountTotal,
      coupon: appliedCoupon
        ? { code: appliedCoupon.code, discount: couponDiscount }
        : null,
    });

    // =====================================================
    // CREATE BOOKINGS ONLY FOR COD
    // =====================================================

    if (paymentMethod === "COD") {
      const serviceIds = order.items.map((i) => i.service);

      const services = await Service.find({
        _id: { $in: serviceIds },
      });

      const serviceMap = {};
      services.forEach((s) => {
        serviceMap[s._id] = s;
      });

      for (const item of order.items) {
        const serviceDoc = serviceMap[item.service];

        await Booking.create({
          customer: order.customer,
          vendor: order.vendor,
          order: order._id,
          category: serviceDoc?.category || "Service",
          service: item.service,
          date: item.date,
          time: item.time,
          selections: item.selections,
          basePrice: item.basePrice,
          addonsPrice: item.addonsPrice,
          totalPrice: item.totalPrice,
          quantity: item.quantity,
          paymentMethod: order.paymentMethod,
          paymentStatus: "pending",
          status: "awaiting",
        });
      }

      io?.to(`vendor:${vendorId}`).emit("booking:new", {
        orderId: order._id,
        message: "New booking received",
      });

      // Create persistent notification and send via socket
      await sendNotification(
        vendorId,
        "New Booking Request",
        `You have received a new booking request for a total of ₹${grandTotal}.`,
        "booking",
        { orderId: order._id.toString() }
      );

      // Create Payment log for COD to show in transactions
      await Payment.create({
        order: order._id,
        customer: userId,
        vendor: vendorId,
        amount: grandTotal,
        method: "COD",
        status: "initiated",
        gateway: "cod",
      });

      await Cart.deleteMany({ user: userId });

      return res.json({
        success: true,
        message: "Order placed with COD",
        data: order,
      });
    }

    // ================= RAZORPAY =================
    if (paymentMethod === "RAZORPAY") {
      const payment = await Payment.create({
        order: order._id,
        customer: userId,
        vendor: vendorId,
        amount: grandTotal,
        method: "RAZORPAY",
        status: "initiated",
        gateway: "razorpay",
      });

      const session = await createRazorpayCheckoutSession({
        amount: grandTotal,
        orderId: order._id,
        userId,
        description: "Home Service Booking",
        notes: {
          orderId: order._id.toString(),
          paymentMethod: "RAZORPAY",
        },
      });

      payment.razorpayPaymentLinkId = session.id;
      await payment.save();

      await Cart.deleteMany({ user: userId });

      return res.json({
        success: true,
        message: "Redirect to Razorpay",
        paymentUrl: session.url,
        razorpayPaymentLinkId: session.id,
      });
    }
  } catch (err) {
    console.error("Checkout error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================= MARK ORDER PAID =======================

exports.markOrderPaid = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const io = req.app.get("io");

    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      await session.abortTransaction();
      session.endSession();
      return res.json({
        success: true,
        message: "Order already marked as paid",
        data: order,
      });
    }

    // ================= UPDATE ORDER =================
    order.paymentStatus = "paid";
    order.status = "confirmed";
    await order.save({ session });

    // 🔥 UPDATE PAYMENT STATUS (NEW)
    await Payment.findOneAndUpdate(
      { order: order._id },
      { status: "held" },
      { session },
    );

    // ================= UPDATE BOOKINGS =================
    await Booking.updateMany(
      { order: order._id },
      {
        paymentStatus: "paid",
        status: "confirmed",
      },
      { session },
    );

    // ================= REFERRAL LOGICS =================
    const customer = await User.findById(order.customer).session(session);

    if (customer && customer.referredBy && !customer.referralRewarded) {
      const paidOrdersCount = await Order.countDocuments({
        customer: order.customer,
        paymentStatus: "paid",
      }).session(session);

      if (paidOrdersCount === 1) {
        const settings = await ReferralSettings.findOne().session(session);

        if (settings && settings.isActive) {
          if (order.grandTotal >= settings.minOrderAmount) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const monthlyCount = await Referral.countDocuments({
              referrer: customer.referredBy,
              createdAt: { $gte: startOfMonth },
            }).session(session);

            if (monthlyCount < settings.monthlyLimit) {
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + settings.expiryDays);

              const rewardAmount = settings.rewardAmount;
              const newUserBonus = settings.bonusForNewUser;

              await Referral.create(
                [
                  {
                    referrer: customer.referredBy,
                    referredUser: customer._id,
                    rewardAmount,
                    bonusToNewUser: newUserBonus,
                    order: order._id,
                    status: "credited",
                    expiresAt: expiryDate,
                  },
                ],
                { session },
              );

              await User.findByIdAndUpdate(
                customer.referredBy,
                {
                  $inc: {
                    referralEarnings: rewardAmount,
                    referralCount: 1,
                  },
                },
                { session },
              );

              await Wallet.findOneAndUpdate(
                { user: customer.referredBy },
                {
                  $inc: {
                    balance: rewardAmount,
                    totalEarnings: rewardAmount,
                  },
                  $push: {
                    transactions: {
                      type: "credit",
                      amount: rewardAmount,
                      description: "Referral reward",
                    },
                  },
                },
                { upsert: true, session },
              );

              if (newUserBonus > 0) {
                await Wallet.findOneAndUpdate(
                  { user: customer._id },
                  {
                    $inc: {
                      balance: newUserBonus,
                      totalEarnings: newUserBonus,
                    },
                    $push: {
                      transactions: {
                        type: "credit",
                        amount: newUserBonus,
                        description: "Referral joining bonus",
                      },
                    },
                  },
                  { upsert: true, session },
                );
              }

              customer.referralRewarded = true;
              await customer.save({ session });
            }
          }
        }
      }
    }

    // ================= SAVE COUPON USAGE =================
    if (order.coupon && order.coupon.code) {
      const coupon = await Coupon.findOne({ code: order.coupon.code }).session(
        session,
      );

      if (coupon) {
        await CouponUsage.create(
          [
            {
              user: order.customer,
              coupon: coupon._id,
              order: order._id,
            },
          ],
          { session },
        );

        await Coupon.findByIdAndUpdate(
          coupon._id,
          { $inc: { usedCount: 1 } },
          { session },
        );
      }
    }

    // ================= COMMIT =================
    await session.commitTransaction();
    session.endSession();

    // ================= SOCKET EVENTS =================
    io?.to("admin").emit("order:update", order);
    io?.to(`user:${order.customer}`).emit("order:update", order);
    io?.to(`vendor:${order.vendor}`).emit("order:update", order);

    return res.json({
      success: true,
      message: "Order marked as paid",
      data: order,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Mark order paid error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================= PREVIEW COUPON =======================
exports.previewCoupon = async (req, res) => {
  try {
    const userId = req.user._id;
    const { couponCode } = req.body;

    if (!couponCode) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon code required" });
    }

    const cartItems = await Cart.find({ user: userId }).populate("service");

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Calculate subtotal
    const globalOffer = await getActiveGlobalOffer();

    let subTotal = 0;

    for (const item of cartItems) {
      const unitPrice = item.unitPrice;
      const itemTotal = unitPrice * item.quantity;

      const { finalAmount } = applyGlobalDiscount(itemTotal, globalOffer);

      subTotal += finalAmount;
    }

    subTotal = Number(subTotal.toFixed(2));

    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid coupon" });
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
