// middlewares/sliderMulter.js
const multer = require("../../middleware/multer");

module.exports = multer.fields([
  { name: "appImage", maxCount: 1 },
  { name: "webImage", maxCount: 1 },
]);
