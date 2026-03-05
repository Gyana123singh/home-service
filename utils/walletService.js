const Wallet = require("../models/Wallet");

async function creditVendor(vendorId, amount, bookingId = null, io = null) {
  let wallet = await Wallet.findOne({ user: vendorId });

  if (!wallet) {
    wallet = await Wallet.create({
      user: vendorId,
      balance: 0,
      totalEarnings: 0,
      transactions: [],
    });
  }

  wallet.balance += amount;
  wallet.totalEarnings += amount;

  wallet.transactions.push({
    type: "credit",
    amount,
    description: "Service payment",
    booking: bookingId,
  });

  await wallet.save();

  if (io) {
    io.to(`vendor:${vendorId}`).emit("wallet:update", wallet);
  }

  return wallet;
}

module.exports = { creditVendor };