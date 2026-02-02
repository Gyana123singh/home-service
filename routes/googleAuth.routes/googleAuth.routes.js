const router = require("express").Router();
const passport = require("passport");
const generateToken = require("../../utils/generateToken");

// STEP 1 → redirect to google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
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

    // redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/google-success?token=${token}`);
  },
);

module.exports = router;
