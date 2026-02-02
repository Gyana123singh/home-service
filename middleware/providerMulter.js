// middlewares/providerMulter.js
const multer = require("../middleware/multer"); // your multer file

module.exports = multer.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "bannerImage", maxCount: 1 },
  { name: "galleryImages", maxCount: 5 },

  { name: "passportImage", maxCount: 1 },
  { name: "nationalIdImage", maxCount: 1 },
  { name: "addressProofImage", maxCount: 1 },

  { name: "metaImage", maxCount: 1 },
]);
