const router = require("express").Router();
const upload = require("../../middleware/multer");
const { reuploadDocuments } = require("../../controllers/vendor/vendorKycController");
const { protect } = require("../../middleware/auth.middleware");
const { isVendor } = require("../../middleware/role.middleware");

router.patch(
  "/reupload-documents",
  protect,
  isVendor,
  upload.fields([
    { name: "aadhaarImage", maxCount: 1 },
    { name: "panImage", maxCount: 1 },
    { name: "passportPhoto", maxCount: 1 },
    { name: "companyCertificate", maxCount: 1 },
  ]),
  reuploadDocuments
);

module.exports = router;
