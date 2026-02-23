const express = require("express");
const router = express.Router();
const { loginWithOtp } = require("../../controllers/otpAuth.controller/otpAuth.controller");

// Flutter will call this after Firebase OTP verification
router.post("/login", loginWithOtp);

module.exports = router;
