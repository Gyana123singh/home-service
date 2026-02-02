const router = require("express").Router();
const { firebaseOtpLogin } = require("../../controllers/otpAuth.controller/otpAuth.controller");

router.post("/otp-login", firebaseOtpLogin);

module.exports = router;
