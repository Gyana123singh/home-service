const express = require("express");
const router = express.Router();
const upload = require("../../middleware/multer");
const {
  registerVendor,
  vendorLogin,
} = require("../../controllers/vendor/vendorController");
const { protect } = require("../../middleware/auth.middleware");
const { isVendor } = require("../../middleware/role.middleware");

router.post(
  "/register-vendor",
  upload.fields([
    { name: "aadhaarImage", maxCount: 1 },
    { name: "panImage", maxCount: 1 },
    { name: "passportPhoto", maxCount: 1 },
    { name: "companyCertificate", maxCount: 1 },
  ]),
  registerVendor,
);
router.post("/login", vendorLogin);

module.exports = router;
