const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await User.findOne({
          $or: [
            { googleId: profile.id },
            { email },
          ],
        });

        if (!user) {
          user = await User.create({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email,
            googleId: profile.id,
            authProvider: "google",
            role: "customer",
          });
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

module.exports = passport;
