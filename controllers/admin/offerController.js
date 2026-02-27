const Offer = require("../../models/Offer");

// CREATE GLOBAL OFFER
exports.createGlobalOffer = async (req, res) => {
  try {
    const { title, discountType, discountValue, startDate, endDate } = req.body;

    // 🔥 Only allow ONE active global offer
    const existing = await Offer.findOne({
      applicableType: "global",
      status: true,
    });

    if (existing) {
      return res.status(400).json({
        message: "An active global offer already exists",
      });
    }

    const offer = await Offer.create({
      title,
      discountType,
      discountValue,
      applicableType: "global",
      startDate,
      endDate,
      status: true,
    });

    res.status(201).json({
      success: true,
      message: "Global offer created successfully",
      data: offer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleOfferStatus = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    offer.status = !offer.status;
    await offer.save();

    res.json({
      success: true,
      message: "Offer status updated",
      data: offer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: offers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
