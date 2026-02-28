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
    const { serviceId, selections, date, quantity } = req.body;

    if (!serviceId || !Array.isArray(selections) || !date) {
      return res.status(400).json({
        success: false,
        message: "serviceId, selections array and date are required",
      });
    }

    // ================= GET SERVICE =================
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // ================= 🔥 CHECK VENDOR ONLINE =================
    const vendorId = service.provider?._id || service.provider;

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
    // ===========================================================

    // ================= VALIDATE REQUIREMENTS =================
    for (const reqField of service.requirements) {
      const found = selections.find((s) => s.label === reqField.label);
      if (!found) {
        return res.status(400).json({
          success: false,
          message: `Please select ${reqField.label}`,
        });
      }
    }

    // ================= CALCULATE PRICE =================
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
// ======================= GET CART =======================
exports.getMyCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cartItems = await Cart.find({ user: userId }).populate({
      path: "service",
      populate: {
        path: "provider",
        select: "firstName lastName isOnline role",
      },
    });

    // 🔥 Filter valid items (service exists + vendor online)
    const validCartItems = cartItems.filter((item) => {
      return (
        item.service &&
        item.service.provider &&
        item.service.provider.role === "vendor" &&
        item.service.provider.isOnline === true
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
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login again.",
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

    if (!["COD", "STRIPE"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const cartItems = await Cart.find({ user: userId }).populate("service");

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const invalidItem = cartItems.find((item) => !item.service);
    if (invalidItem) {
      return res.status(400).json({
        success: false,
        message:
          "Some services in your cart are no longer available. Please refresh your cart.",
      });
    }

    // ================= 🔥 CHECK VENDOR ONLINE =================
    for (const item of cartItems) {
      const vendorId = item.service.provider?._id || item.service.provider;

      const vendor = await User.findById(vendorId);

      if (!vendor || vendor.role !== "vendor") {
        return res.status(400).json({
          success: false,
          message: "Invalid vendor for one of the services",
        });
      }

      if (!vendor.isOnline) {
        return res.status(400).json({
          success: false,
          message: "Vendor is currently offline. Please try later.",
        });
      }
    }
    // =========================================================

    // ================= APPLY GLOBAL OFFER =================
    const globalOffer = await getActiveGlobalOffer();

    let subTotal = 0;
    let globalDiscountTotal = 0;

    cartItems.forEach((item) => {
      const originalItemTotal = item.totalPrice * item.quantity;

      const { finalAmount, discountAmount } = applyGlobalDiscount(
        originalItemTotal,
        globalOffer,
      );

      subTotal += finalAmount;
      globalDiscountTotal += discountAmount;
    });

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

      if (!coupon)
        return res.status(400).json({
          success: false,
          message: "Invalid coupon code",
        });

      if (coupon.expiresAt && coupon.expiresAt < new Date())
        return res.status(400).json({
          success: false,
          message: "Coupon expired",
        });

      if (subTotal < coupon.minOrderValue)
        return res.status(400).json({
          success: false,
          message: "Order amount too low for this coupon",
        });

      const usedByUser = await CouponUsage.countDocuments({
        user: userId,
        coupon: coupon._id,
      });

      if (usedByUser >= coupon.perUserLimit)
        return res.status(400).json({
          success: false,
          message: "You have already used this coupon",
        });

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

    // ================= FINAL TOTAL =================
    const discountedSubTotal = Number(
      Math.max(subTotal - couponDiscount, 0).toFixed(2),
    );

    const tax = Number((discountedSubTotal * 0.18).toFixed(2));
    const grandTotal = Number((discountedSubTotal + tax).toFixed(2));

    if (!grandTotal || isNaN(grandTotal) || grandTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid total amount",
      });
    }

    // ================= CREATE ORDER =================
    const vendorId =
      cartItems[0].service.provider?._id || cartItems[0].service.provider;

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
      subTotal: discountedSubTotal,
      tax,
      grandTotal,
      status: "placed",
      globalDiscount: globalDiscountTotal,
      coupon: appliedCoupon
        ? { code: appliedCoupon.code, discount: couponDiscount }
        : null,
    });

    await Cart.deleteMany({ user: userId });

    if (paymentMethod === "COD") {
      return res.json({
        success: true,
        message: "Order placed with COD",
        data: order,
      });
    }

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
  } catch (err) {
    console.error("❌ Checkout error:", err);
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

    // ================= REFERRAL LOGIC =================
    const customer = await User.findById(order.customer).session(session);

    if (customer && customer.referredBy && !customer.referralRewarded) {
      const paidOrdersCount = await Order.countDocuments({
        customer: order.customer,
        paymentStatus: "paid",
      }).session(session);

      // Only first paid order
      if (paidOrdersCount === 1) {
        const settings = await ReferralSettings.findOne().session(session);

        if (settings && settings.isActive) {
          // Minimum order check
          if (order.grandTotal >= settings.minOrderAmount) {
            // Monthly limit check
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const monthlyCount = await Referral.countDocuments({
              referrer: customer.referredBy,
              createdAt: { $gte: startOfMonth },
            }).session(session);

            if (monthlyCount < settings.monthlyLimit) {
              // Expiry date
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + settings.expiryDays);

              const rewardAmount = settings.rewardAmount;
              const newUserBonus = settings.bonusForNewUser;

              // ✅ Create referral record
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

              // ✅ Update referrer earnings
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

              // ✅ Credit referrer wallet
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

              // ✅ Bonus wallet credit for NEW USER
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

              // Mark rewarded
              customer.referralRewarded = true;
              await customer.save({ session });
            } else {
              console.log("Monthly referral limit reached");
            }
          }
        }
      }
    }

    // ✅ Commit transaction
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
    let subTotal = 0;
    cartItems.forEach((item) => {
      subTotal += item.totalPrice * item.quantity;
    });

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
