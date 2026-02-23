const axios = require("axios");
const crypto = require("crypto");

const {
  PHONEPE_MERCHANT_ID,
  PHONEPE_SALT_KEY,
  PHONEPE_SALT_INDEX,
  PHONEPE_BASE_URL,
  PHONEPE_REDIRECT_URL,
} = process.env;

function generateChecksum(payload) {
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  const stringToSign = base64Payload + "/pg/v1/pay" + PHONEPE_SALT_KEY;
  const hash = crypto.createHash("sha256").update(stringToSign).digest("hex");
  return {
    base64Payload,
    checksum: hash + "###" + PHONEPE_SALT_INDEX,
  };
}

async function createPhonePePayment({ amount, merchantTransactionId, userId }) {
  const payload = {
    merchantId: PHONEPE_MERCHANT_ID,
    merchantTransactionId,
    merchantUserId: userId.toString(),
    amount: Math.round(amount * 100), // paise
    redirectUrl: PHONEPE_REDIRECT_URL,
    redirectMode: "POST",
    paymentInstrument: { type: "PAY_PAGE" },
  };

  const { base64Payload, checksum } = generateChecksum(payload);

  const res = await axios.post(
    `${PHONEPE_BASE_URL}/pg/v1/pay`,
    { request: base64Payload },
    {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
    }
  );

  return res.data;
}

module.exports = { createPhonePePayment };