const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const connectDB = require("./config/dbConnection");
require("dotenv").config();

const { initSocket } = require("./sockets/socket"); // 👈 import socket init

const adminRouter = require("./routes/adminRoutes/index");
const vendorRouter = require("./routes/vendorRoutes/index");
const customerRouter = require("./routes/customerRoutes/index");
const googleAuthRoutes = require("./routes/googleAuth.routes/googleAuth.routes");
const otpRoutes = require("./routes/otpAuth.routes/otpAuth.routes");

// for Admins router
const vendorApprovalRoutes = require("./routes/adminRoutes/vendorApprovalRoutes");
const providerRoutes = require("./routes/adminRoutes/providerRoutes");
const serviceRouter = require("./routes/adminRoutes/serviceRoutes");
const serviceCateogoryRouter = require("./routes/adminRoutes/categoryRoutes");
const sliderRouter = require("./routes/adminRoutes/sliderRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

connectDB();

const passport = require("./config/passport");
app.use(passport.initialize());

// ================= ROUTES =================

app.use("/api/admin", adminRouter);
app.use("/api/vendor", vendorRouter);
app.use("/api/customer", customerRouter);
app.use("/api/googleAuth", googleAuthRoutes);
app.use("/api/otpAuth", otpRoutes);

// admin routes
app.use("/api/admin/approval", vendorApprovalRoutes);
app.use("/api/admin/provider", providerRoutes);
app.use("/api/admin/service", serviceRouter);
app.use("/api/admin/service-category", serviceCateogoryRouter);
app.use("/api/admin/slider", sliderRouter);

// health check
app.get("/", (req, res) => {
  res.send("Home Service Backend Running");
});

// ================= HTTP SERVER =================

const server = http.createServer(app);

// 🔌 Initialize Socket.IO with CORS from HERE
initSocket(server, app, {
  cors: {
    origin: process.env.SOCKET_ORIGIN || "*", // e.g. http://localhost:3000
    methods: ["GET", "POST"],
  },
});

// ================= START SERVER =================

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
