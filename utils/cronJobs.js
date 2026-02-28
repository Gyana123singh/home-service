const cron = require("node-cron");
const { expireReferrals } = require("./referralExpiryJob");

cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      console.log("Running referral expiry job...");
      await expireReferrals();
    } catch (error) {
      console.error("Referral expiry job failed:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);

console.log("Referral cron initialized");
