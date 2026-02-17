const Booking = require("../../models/CustomerBooking");
const Service = require("../../models/AdminService");


exports.createBooking = async (req, res) => {
  const {
    serviceId,
    date,
    time,
    bedroomsOptionId,
    cleaningTypeOptionId,
    frequencyOptionId,
  } = req.body;

  const service = await Service.findById(serviceId);

  const bedroomOpt = await ServiceOption.findById(bedroomsOptionId);
  const cleaningOpt = await ServiceOption.findById(cleaningTypeOptionId);
  const frequencyOpt = await ServiceOption.findById(frequencyOptionId);

  const basePrice = service.discountPrice || service.price;

  const totalPrice =
    basePrice +
    (bedroomOpt?.extraPrice || 0) +
    (cleaningOpt?.extraPrice || 0) +
    (frequencyOpt?.extraPrice || 0);

  const booking = await Booking.create({
    customer: req.user._id,
    vendor: service.vendor,
    service: service._id,
    date,
    time,

    selections: {
      bedrooms: bedroomOpt
        ? { optionId: bedroomOpt._id, label: bedroomOpt.label, extraPrice: bedroomOpt.extraPrice }
        : null,
      cleaningType: cleaningOpt
        ? { optionId: cleaningOpt._id, label: cleaningOpt.label, extraPrice: cleaningOpt.extraPrice }
        : null,
      frequency: frequencyOpt
        ? { optionId: frequencyOpt._id, label: frequencyOpt.label, extraPrice: frequencyOpt.extraPrice }
        : null,
    },

    basePrice,
    totalPrice,
  });

  res.json({ success: true, booking });
};
