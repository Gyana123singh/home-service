// test_checkout.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/dbConnection");

const User = require("./models/User");
const Service = require("./models/VendorService");
const Cart = require("./models/Cart");
const Order = require("./models/Order");
const Payment = require("./models/Payment");

const { checkOut } = require("./controllers/customer/cartController");

async function runTest() {
  console.log("Connecting to Database...");
  await connectDB();

  console.log("Cleaning up old test data...");
  await User.deleteMany({ email: /@test-antigravity-checkout\.com$/ });
  await Service.deleteMany({ name: "Antigravity Checkout Test Service" });

  console.log("Creating test users...");
  const randPhone1 = "9" + Math.floor(100000000 + Math.random() * 900000000).toString();
  const randPhone2 = "8" + Math.floor(100000000 + Math.random() * 900000000).toString();

  const customer = await User.create({
    name: "Checkout Customer",
    email: "customer@test-antigravity-checkout.com",
    password: "password123",
    role: "customer",
    phone: randPhone1,
  });

  const vendor = await User.create({
    name: "Checkout Vendor",
    email: "vendor@test-antigravity-checkout.com",
    password: "password123",
    role: "vendor",
    phone: randPhone2,
    isOnline: true,
  });

  console.log("Creating test service...");
  const service = await Service.create({
    name: "Antigravity Checkout Test Service",
    description: "Testing Razorpay Checkout",
    basePrice: 500,
    category: "cleaning",
    vendor: vendor._id,
    isActive: true,
  });

  console.log("Adding service to customer cart...");
  await Cart.create({
    user: customer._id,
    service: service._id,
    quantity: 1,
    unitPrice: 500,
    basePrice: 500,
    addonsPrice: 0,
    totalPrice: 500,
    date: new Date(),
    time: "10:00 AM",
  });

  // Mock Request & Response
  const req = {
    user: customer,
    body: {
      paymentMethod: "RAZORPAY",
      address: {
        addressLine1: "123 Main St",
        city: "Cityville",
        state: "State",
        pincode: "123456",
      }
    },
    app: {
      get: (key) => {
        if (key === "io") {
          return {
            to: (room) => ({
              emit: (event, data) => console.log(`[Socket] Room: ${room}, Event: ${event}`)
            })
          };
        }
        return null;
      }
    }
  };

  let responseStatus = 200;
  let responseData = null;

  const res = {
    status: (code) => {
      responseStatus = code;
      return res;
    },
    json: (obj) => {
      responseData = obj;
      return res;
    }
  };

  console.log("Invoking checkout controller...");
  
  // We modify checkOut to catch and print error stack
  try {
    await checkOut(req, res);
    console.log(`Checkout response status: ${responseStatus}`);
    console.log("Response data:", responseData);
  } catch (error) {
    console.error("FATAL CRASH in checkout controller:", error);
  }

  // Clean up
  console.log("Cleaning up DB...");
  await Cart.deleteMany({ user: customer._id });
  await User.findByIdAndDelete(customer._id);
  await User.findByIdAndDelete(vendor._id);
  await Service.findByIdAndDelete(service._id);
  if (responseData && responseData.data) {
    await Order.findByIdAndDelete(responseData.data._id);
    await Payment.deleteMany({ order: responseData.data._id });
  }
  
  console.log("Test finished.");
}

runTest()
  .then(() => {
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Execution failed:", err);
    mongoose.connection.close();
    process.exit(1);
  });
