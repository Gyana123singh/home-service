const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const { generateReferralCode } = require("../utils/referral");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails && profile.emails.length > 0
            ? profile.emails[0].value
            : null;

        if (!email) {
          return done(new Error("No email returned from Google"), null);
        }

        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (!user) {
          const referralCodeFromQuery = req.query.ref || null;
          let referredByUser = null;

          if (referralCodeFromQuery) {
            referredByUser = await User.findOne({
              referralCode: referralCodeFromQuery,
            });

            // ✅ Prevent self-referral
            if (referredByUser && referredByUser.email === email) {
              referredByUser = null;
            }
          }

          user = await User.create({
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            email,
            googleId: profile.id,
            authProvider: "google",
            role: "customer",
            referralCode: await generateReferralCode(
              profile.name?.givenName || "USR",
            ),
            referredBy: referredByUser ? referredByUser._id : null,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

module.exports = passport;
