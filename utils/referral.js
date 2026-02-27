exports.generateReferralCode = async (firstName = "USR") => {
  const User = require("../models/User");

  let code;
  let exists = true;

  while (exists) {
    const random = Math.floor(1000 + Math.random() * 9000);

    const prefix =
      firstName && firstName.length >= 3
        ? firstName.substring(0, 3).toUpperCase()
        : "USR";

    code = prefix + random;

    const user = await User.findOne({ referralCode: code });
    if (!user) exists = false;
  }

  return code;
};