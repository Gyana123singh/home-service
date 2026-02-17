const Booking = require("../models/Booking");
const Service = require("../models/Service");
const ServiceOption = require("../models/ServiceOption");

const Booking = require("../../models/Booking");
const Service = require("../../models/Service");
const ServiceOption = require("../../models/ServiceOption");

exports.createBooking = async (req, res) => {
  const { serviceId, date, time, selections } = req.body;
  // selections = [ { optionId }, { optionId }, ... ]

  const service = await Service.findById(serviceId);
  let basePrice = service.discountedPrice || service.basePrice;

  let totalPrice = basePrice;
  const finalSelections = [];

  for (const sel of selections) {
    const opt = await ServiceOption.findById(sel.optionId);
    if (opt) {
      totalPrice += opt.extraPrice;
      finalSelections.push({
        optionId: opt._id,
        type: opt.type,
        label: opt.label,
        extraPrice: opt.extraPrice,
      });
    }
  }

  const booking = await Booking.create({
    customer: req.user._id,
    vendor: service.vendor,
    service: service._id,
    date,
    time,
    selections: finalSelections,
    basePrice,
    totalPrice,
  });

  res.json({ success: true, booking });
};
