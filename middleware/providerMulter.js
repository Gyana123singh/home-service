const multer = require("../middleware/multer");

module.exports = multer.fields([
  { name: "aadhaarImage", maxCount: 1 },
  { name: "panImage", maxCount: 1 },
  { name: "companyCertificate", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
]);