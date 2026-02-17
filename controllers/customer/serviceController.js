const Category = require("../../models/Category");
const Service = require("../../models/Service");
const ServiceOption = require("../../models/ServiceOption");

exports.getCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true });
  res.json({ success: true, categories });
};

exports.getServicesByCategory = async (req, res) => {
  const { categoryId } = req.params;
  const services = await Service.find({ category: categoryId, isActive: true });
  res.json({ success: true, services });
};

exports.getServiceOptions = async (req, res) => {
  const { categoryId } = req.params;

  const options = await ServiceOption.find({ category: categoryId, isActive: true });

  const grouped = {};
  options.forEach(opt => {
    if (!grouped[opt.type]) grouped[opt.type] = [];
    grouped[opt.type].push(opt);
  });

  res.json({ success: true, options: grouped });
};
