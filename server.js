const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const connectDB = require("./config/dbConnection");
require("dotenv").config();

const { initSocket } = require("./sockets/socket"); // 👈 socket init

const adminRouter = require("./routes/adminRoutes/index");
const vendorRouter = require("./routes/vendorRoutes/index");
const customerRouter = require("./routes/customerRoutes/index");
const googleAuthRoutes = require("./routes/googleAuth.routes/googleAuth.routes");
const otpRoutes = require("./routes/otpAuth.routes/otpAuthRoutes");
const razorpayWebhookRoutes = require("./routes/customerRoutes/razorpayWebhook"); // 👈 Razorpay webhook
const contactRoute = require("./routes/websiteRoutes/contactRoute"); // 👈 Contact form route
const registerRoute = require("./routes/websiteRoutes/registerRoute"); // 👈 Registration form route
const app = express();

// ================== RAZORPAY WEBHOOK (MUST BE FIRST) ==================
// ❗ IMPORTANT: This must come BEFORE express.json()
app.use("/api/customer/payment", razorpayWebhookRoutes);

// ================== MIDDLEWARES ==================
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://hirehand.co.in",
      "https://admin.hirehand.co.in",
      "*",
      true,
    ],
  }),
);
app.use(morgan("dev"));
app.use(express.json()); // after webhook
// ✅ ✅ ADD HERE
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

connectDB();

const passport = require("./config/passport");
app.use(passport.initialize());

// ================= ROUTES =================

app.use("/api/admin", adminRouter);
app.use("/api/vendor", vendorRouter);
app.use("/api/customer", customerRouter);
app.use("/api/googleAuth", googleAuthRoutes);
app.use("/api/otp/auth", otpRoutes);
app.use("/api/contact", contactRoute);
app.use("/api/register", registerRoute);

// health check
app.get("/", (req, res) => {
  res.send("Home Service Backend Running");
});

// ================= HTTP SERVER =================

const server = http.createServer(app);

// 🔌 Initialize Socket.IO
initSocket(server, app, {
  cors: {
    origin: process.env.SOCKET_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

// 🔥 LOAD CRON JOBS HERE
require("./utils/cronJobs");
// ================= START SERVER =================

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
