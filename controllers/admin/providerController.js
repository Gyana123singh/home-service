// controllers/admin/provider.controller.js
const User = require("../../models/User");
const ProviderProfile = require("../../models/AdminProviderProfile");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");
const bcrypt = require("bcryptjs");

/**
 * =========================
 * CREATE PROVIDER
 * =========================
 */
exports.createProvider = async (req, res) => {
  try {
    const {
      // Provider info
      name,
      companyName,
      description,

      // Other info
      slug,
      visitingCharge,
      advanceBookingDays,
      totalMembers,
      atStore,
      atDoorstep,
      allowPostBookingChat,
      status,

      // Working days
      workingDays,

      // Location
      currentLocation,
      address,
      city,
      lat,
      lng,

      // Personal
      email,
      phone,
      password,

      // Bank
      taxName,
      taxNumber,
      accountName,
      accountNumber,
      bankName,
      bankCode,
      swiftCode,

      // SEO
      metaTitle,
      metaKeywords,
      metaDescription,
      schemaMarkup,
    } = req.body;

    /* ---------------- VALIDATIONS ---------------- */
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required",
      });
    }

    if (!city || !lat || !lng || !address) {
      return res.status(400).json({
        success: false,
        message: "Complete location information is required",
      });
    }

    /* ---------------- WORKING DAYS SAFE PARSE ---------------- */
    let parsedWorkingDays = [];
    if (workingDays) {
      try {
        parsedWorkingDays = JSON.parse(workingDays);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid workingDays format",
        });
      }
    }

    /* ---------------- CREATE USER ---------------- */
    const hashedPassword = await bcrypt.hash(password, 10);

    const vendor = await User.create({
      firstName: name,
      email,
      phone,
      password: hashedPassword,
      role: "vendor",
      vendorStatus: status === "true" ? "approved" : "pending",
    });

    /* ---------------- UPLOAD IMAGES ---------------- */
    const profileImage = req.files?.profileImage
      ? (
          await uploadToCloudinary(
            req.files.profileImage[0],
            "providers/profile",
          )
        ).secure_url
      : "";

    const bannerImage = req.files?.bannerImage
      ? (await uploadToCloudinary(req.files.bannerImage[0], "providers/banner"))
          .secure_url
      : "";

    const metaImage = req.files?.metaImage
      ? (await uploadToCloudinary(req.files.metaImage[0], "providers/seo"))
          .secure_url
      : "";

    const galleryImages = [];
    if (req.files?.galleryImages) {
      for (const file of req.files.galleryImages) {
        const uploaded = await uploadToCloudinary(file, "providers/gallery");
        galleryImages.push(uploaded.secure_url);
      }
    }

    /* ---------------- KYC DOCUMENTS ---------------- */
    vendor.documents = {
      passportPhoto: req.files?.passportImage
        ? (
            await uploadToCloudinary(
              req.files.passportImage[0],
              "providers/docs",
            )
          ).secure_url
        : "",
      aadhaarImage: req.files?.nationalIdImage
        ? (
            await uploadToCloudinary(
              req.files.nationalIdImage[0],
              "providers/docs",
            )
          ).secure_url
        : "",
      companyCertificate: req.files?.addressProofImage
        ? (
            await uploadToCloudinary(
              req.files.addressProofImage[0],
              "providers/docs",
            )
          ).secure_url
        : "",
    };

    await vendor.save();

    /* ---------------- CREATE PROVIDER PROFILE ---------------- */
    const profile = await ProviderProfile.create({
      vendor: vendor._id,
      companyName,
      slug,
      description,

      visitingCharge,
      advanceBookingDays,
      totalMembers,

      isStoreActive: atStore === "true",
      isDoorstepActive: atDoorstep === "true",
      allowLiveChat: allowPostBookingChat === "true",

      workingDays: parsedWorkingDays,

      location: {
        currentLocation,
        city,
        lat: Number(lat),
        lng: Number(lng),
        address,
      },

      images: {
        profile: profileImage,
        banner: bannerImage,
        gallery: galleryImages,
      },

      bankDetails: {
        taxName,
        taxNumber,
        accountName,
        accountNumber,
        bankName,
        bankCode,
        swiftCode,
      },

      seo: {
        metaTitle,
        metaKeywords,
        metaDescription,
        schemaMarkup,
        metaImage,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Provider created successfully",
      vendorId: vendor._id,
      profileId: profile._id,
    });
  } catch (error) {
    console.error("CREATE PROVIDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =========================
 * GET PROVIDERS (LIST)
 * =========================
 */
exports.getProviders = async (req, res) => {
  try {
    const {
      status, // approved | rejected | pending
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    const matchStage = { role: "vendor" };
    if (status) matchStage.vendorStatus = status;

    /* ---------------- DATA PIPELINE ---------------- */
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "providerprofiles",
          localField: "_id",
          foreignField: "vendor",
          as: "profile",
        },
      },
      { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { "profile.companyName": { $regex: search, $options: "i" } },
            { "profile.slug": { $regex: search, $options: "i" } },
          ],
        },
      },
      {
        $project: {
          providerName: "$firstName",
          email: 1,
          phone: 1,
          status: "$vendorStatus",
          companyName: "$profile.companyName",
          slug: "$profile.slug",
          profileImage: "$profile.images.profile",
          stars: { $literal: 0.0 },
          type: { $literal: "Individual" },
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) },
    ];

    const data = await User.aggregate(pipeline);

    /* ---------------- TOTAL COUNT (FIXED) ---------------- */
    const countPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "providerprofiles",
          localField: "_id",
          foreignField: "vendor",
          as: "profile",
        },
      },
      { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { "profile.companyName": { $regex: search, $options: "i" } },
            { "profile.slug": { $regex: search, $options: "i" } },
          ],
        },
      },
      { $count: "total" },
    ];

    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      data,
    });
  } catch (error) {
    console.error("GET PROVIDERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
