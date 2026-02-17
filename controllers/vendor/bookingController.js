const Booking = require("../../models/VendorBooking");
const Service = require("../../models/VendorService");
const Wallet = require("../../models/VendorWallet");

exports.createBooking = async (req, res) => {
  const { serviceId, date, time } = req.body;
  const service = await Service.findById(serviceId);

  const booking = await Booking.create({
    customer: req.user._id,
    vendor: service.vendor,
    service: service._id,
    date,
    time,
    price: service.discountPrice || service.price,
  });

  res.json({ success: true, booking });
};

exports.vendorBookings = async (req, res) => {
  const { status } = req.query;
  const filter = { vendor: req.user._id };
  if (status) filter.status = status;

  const bookings = await Booking.find(filter).populate("service customer");
  res.json({ success: true, bookings });
};

exports.acceptBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  booking.vendorAction = "accepted";
  booking.status = "confirmed";
  await booking.save();
  res.json({ success: true });
};

exports.completeBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  booking.status = "completed";
  await booking.save();

  let wallet = await Wallet.findOne({ user: booking.vendor });
  if (!wallet) wallet = await Wallet.create({ user: booking.vendor });

  wallet.balance += booking.price;
  wallet.totalEarnings += booking.price;
  await wallet.save();

  res.json({ success: true });
};
