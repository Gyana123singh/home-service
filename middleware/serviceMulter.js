// middlewares/serviceMulter.js
const multer = require("../middleware/multer");

module.exports = multer.fields([
  { name: "mainImage", maxCount: 1 },
  { name: "otherImages", maxCount: 5 },
  { name: "files", maxCount: 5 },
  { name: "metaImage", maxCount: 1 },
]);
