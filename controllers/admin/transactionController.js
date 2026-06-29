const Payment = require("../../models/Payment");
const SubscriptionPayment = require("../../models/SubscriptionPayment");
const WithdrawRequest = require("../../models/WithdrawRequest");

// ================= GET UNIFIED TRANSACTIONS =================
exports.getUnifiedTransactions = async (req, res) => {
  try {
    const { search = "", type = "all", status = "all" } = req.query;

    // Fetch booking payments
    let paymentsQuery = Payment.find()
      .populate("customer", "firstName lastName email")
      .populate("vendor", "firstName lastName");

    // Fetch subscription payments
    let subPaymentsQuery = SubscriptionPayment.find()
      .populate("vendor", "firstName lastName email")
      .populate("plan", "name price");

    // Fetch withdrawals
    let withdrawsQuery = WithdrawRequest.find()
      .populate("vendor", "firstName lastName email");

    const [payments, subPayments, withdraws] = await Promise.all([
      paymentsQuery,
      subPaymentsQuery,
      withdrawsQuery
    ]);

    const unifiedList = [];

    // 1. Process Subscription Payments
    subPayments.forEach((sp) => {
      const vendorName = sp.vendor ? `${sp.vendor.firstName || ""} ${sp.vendor.lastName || ""}`.trim() : "Unknown Vendor";
      
      // Filter type
      if (type !== "all" && type !== "subscription") return;

      const unifiedStatus = sp.status === "paid" ? "Success" : "Failed";
      
      // Filter status
      if (status !== "all" && status.toLowerCase() !== unifiedStatus.toLowerCase()) return;

      // Filter search
      const textToSearch = `${vendorName} ${sp.vendor?.email || ""} ${sp.plan?.name || ""} subscription`.toLowerCase();
      if (search && !textToSearch.includes(search.toLowerCase())) return;

      unifiedList.push({
        id: sp._id,
        user: vendorName,
        userId: sp.vendor?._id || "-",
        userEmail: sp.vendor?.email || "-",
        paymentMethod: sp.razorpayPaymentId ? "Razorpay" : "Stripe",
        transactionId: sp.razorpayPaymentId || sp.stripePaymentIntentId || "-",
        transactionType: "subscription",
        amount: sp.amount || 0,
        date: sp.createdAt,
        status: unifiedStatus
      });
    });

    // 2. Process Booking Payments
    payments.forEach((bp) => {
      const customerName = bp.customer ? `${bp.customer.firstName || ""} ${bp.customer.lastName || ""}`.trim() : "Unknown Customer";
      
      // Filter type
      if (type !== "all" && type !== "booking") return;

      const unifiedStatus = (bp.status === "released" || bp.status === "held") ? "Success" : bp.status === "failed" ? "Failed" : "Pending";

      // Filter status
      if (status !== "all" && status.toLowerCase() !== unifiedStatus.toLowerCase()) return;

      // Filter search
      const textToSearch = `${customerName} ${bp.customer?.email || ""} ${bp.method || ""} booking`.toLowerCase();
      if (search && !textToSearch.includes(search.toLowerCase())) return;

      unifiedList.push({
        id: bp._id,
        user: customerName,
        userId: bp.customer?._id || "-",
        userEmail: bp.customer?.email || "-",
        paymentMethod: bp.method || "Other",
        transactionId: bp.razorpayPaymentId || bp.stripePaymentIntentId || "-",
        transactionType: "booking",
        amount: bp.amount || 0,
        date: bp.createdAt,
        status: unifiedStatus
      });
    });

    // 3. Process Withdraw Requests
    withdraws.forEach((wr) => {
      const vendorName = wr.vendor ? `${wr.vendor.firstName || ""} ${wr.vendor.lastName || ""}`.trim() : "Unknown Vendor";
      
      // Filter type
      if (type !== "all" && type !== "withdrawal") return;

      let unifiedStatus = "Pending";
      if (wr.status === "paid" || wr.status === "approved") {
        unifiedStatus = "Success";
      } else if (wr.status === "rejected") {
        unifiedStatus = "Failed";
      }

      // Filter status
      if (status !== "all" && status.toLowerCase() !== unifiedStatus.toLowerCase()) return;

      // Filter search
      const textToSearch = `${vendorName} ${wr.vendor?.email || ""} ${wr.method || ""} withdrawal`.toLowerCase();
      if (search && !textToSearch.includes(search.toLowerCase())) return;

      unifiedList.push({
        id: wr._id,
        user: vendorName,
        userId: wr.vendor?._id || "-",
        userEmail: wr.vendor?.email || "-",
        paymentMethod: wr.method || "Bank",
        transactionId: "-",
        transactionType: "withdrawal",
        amount: wr.amount || 0,
        date: wr.createdAt,
        status: unifiedStatus
      });
    });

    // Sort by date descending
    unifiedList.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: unifiedList
    });
  } catch (error) {
    console.error("GET UNIFIED TRANSACTIONS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error loading transactions"
    });
  }
};
