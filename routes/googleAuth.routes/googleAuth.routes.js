const router = require("express").Router();
const passport = require("passport");
const generateToken = require("../../utils/generateToken");

// STEP 1 → redirect to google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["openid", "profile", "email"],
    prompt: "select_account", // 👈 force account chooser
  }),
);

// STEP 2 → callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const token = generateToken(req.user);

    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

    res.redirect(`${FRONTEND_URL}/google-success?token=${token}`);
  },
);

module.exports = router;
