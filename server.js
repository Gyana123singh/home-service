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
const stripeWebhookRoutes = require("./routes/customerRoutes/stripeWebhook"); // 👈 Stripe webhook


const app = express();

// ================== STRIPE WEBHOOK (MUST BE FIRST) ==================
// ❗ IMPORTANT: This must come BEFORE express.json()
app.use("/api/customer/payment", stripeWebhookRoutes);

// ================== MIDDLEWARES ==================
app.use(cors());
app.use(morgan("dev"));
app.use(express.json()); // after webhook

connectDB();

const passport = require("./config/passport");
app.use(passport.initialize());

// ================= ROUTES =================

app.use("/api/admin", adminRouter);
app.use("/api/vendor", vendorRouter);
app.use("/api/customer", customerRouter);
app.use("/api/googleAuth", googleAuthRoutes);
app.use("/api/otp/auth", otpRoutes);



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

// ================= START SERVER =================

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;