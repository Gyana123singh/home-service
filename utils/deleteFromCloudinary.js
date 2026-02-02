const cloudinary = require("../config/cloudinary");

const extractPublicId = (url) => {
  const parts = url.split("/");
  const file = parts[parts.length - 1];
  return file.split(".")[0];
};

const deleteFromCloudinary = async (url) => {
  if (!url) return;
  const publicId = extractPublicId(url);
  await cloudinary.uploader.destroy(publicId);
};

module.exports = deleteFromCloudinary;
