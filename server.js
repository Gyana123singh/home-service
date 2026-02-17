const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const connectDB = require("./config/dbConnection");
require("dotenv").config();

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

// for Customers router

const app = express();

app.use(cors());
app.use(express.json());
connectDB();

const passport = require("./config/passport");

app.use(passport.initialize());

// api for login and register for all roles
app.use("/api/admin", adminRouter); // admin login
app.use("/api/vendor", vendorRouter); //vendor register and login
app.use("/api/customer", customerRouter); // customer register and login
app.use("/api/googleAuth", googleAuthRoutes); // google login auth
app.use("/api/otpAuth", otpRoutes);

// for Admins router
app.use("/api/admin/approval", vendorApprovalRoutes);
app.use("/api/admin/provider", providerRoutes);
app.use("/api/admin/service", serviceRouter);
app.use("/api/admin/service-category", serviceCateogoryRouter);
app.use("/api/admin/slider", sliderRouter);

// for Vendors router

// for Customers router

app.get("/", (req, res) => {
  res.send("Home Service Backend Running");
});

const server = http.createServer(app);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
