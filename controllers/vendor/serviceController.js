const vendorService = require("../../models/VendorService");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");

exports.createService = async (req, res) => {
  try {
    const {
      name,
      description,
      serviceMode,
      section,
      category,
      days, // array: ["Mon","Tue"]
      startTime, // "09:00"
      endTime, // "18:00"
      price,
      discountPrice,
      address,
    } = req.body;

    // ===== Basic validation =====
    if (
      !name ||
      !description ||
      !serviceMode ||
      !section ||
      !category ||
      !days ||
      !startTime ||
      !endTime ||
      !price ||
      !address
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // ===== Upload images if any =====
    const images = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadToCloudinary(file, "services");
        images.push(uploaded.secure_url);
      }
    }

    // ===== Create service =====
    const service = await vendorService.create({
      vendor: req.user._id,

      name,
      description,
      serviceMode,
      section,
      category,

      availability: {
        days: Array.isArray(days) ? days : JSON.parse(days), // in case sent as string
        startTime,
        endTime,
      },

      price,
      discountPrice: discountPrice || 0,
      address,

      images,
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    console.error("Create Service Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while creating service",
    });
  }
};

exports.getMyServices = async (req, res) => {
  const services = await vendorService.find({ vendor: req.user._id });
  res.json({ success: true, services });
};
