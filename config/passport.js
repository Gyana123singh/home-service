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

          const avatarUrl =
            profile.photos && profile.photos.length > 0
              ? profile.photos[0].value
              : null;

          user = await User.create({
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            email,
            googleId: profile.id,
            authProvider: "google",
            role: "customer",
            avatar: avatarUrl || undefined,
            referralCode: await generateReferralCode(
              profile.name?.givenName || "USR",
            ),
            referredBy: referredByUser ? referredByUser._id : null,
          });
        } else {
          // Update avatar from Google profile on every login
          const avatarUrl =
            profile.photos && profile.photos.length > 0
              ? profile.photos[0].value
              : null;
          console.log("Google OAuth - Existing user login:");
          console.log("  profile.photos:", JSON.stringify(profile.photos));
          console.log("  avatarUrl:", avatarUrl);
          console.log("  user.avatar (before):", user.avatar);
          if (avatarUrl) {
            user.avatar = avatarUrl;
            await user.save();
            console.log("  user.avatar (after):", user.avatar);
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

module.exports = passport;
