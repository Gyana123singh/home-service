const cron = require("node-cron");
const { expireReferrals } = require("./referralExpiryJob");
const { expireSubscriptions } = require("./subscriptionExpiryJob");

cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      console.log("Running daily background jobs...");
      await expireReferrals();
      await expireSubscriptions();
    } catch (error) {
      console.error("Background jobs failed:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);

console.log("Cron jobs initialized");
