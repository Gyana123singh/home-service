// middlewares/categoryMulter.js
const multer = require("../middleware/multer");

module.exports = multer.fields([
  { name: "image", maxCount: 1 },      // category image (required)
  { name: "metaImage", maxCount: 1 },  // SEO image (optional)
]);
