const Wallet = require("../models/Wallet");

async function creditVendor(vendorId, amount) {
  let wallet = await Wallet.findOne({ user: vendorId });

  if (!wallet) {
    wallet = await Wallet.create({
      user: vendorId,
      balance: 0,
      totalEarnings: 0,
    });
  }

  wallet.balance += amount;
  wallet.totalEarnings += amount;
  await wallet.save();

  return wallet;
}

module.exports = { creditVendor };
