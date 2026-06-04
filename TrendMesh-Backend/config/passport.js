import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import User from "../model/userModel.js";
import dotenv from "dotenv";
dotenv.config();

passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    const user = await User.findById(id);
    cb(null, user);
  } catch (err) {
    cb(err, null);
  }
});

// Google Strategy ✔
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
            isVerified: true,
          });
        }

        cb(null, user);
      } catch (error) {
        cb(error, null);
      }
    },
  ),
);

// Facebook Strategy ✔
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FB_CLIENT_ID,
      clientSecret: process.env.FB_CLIENT_SECRET,
      callbackURL: process.env.FB_CALLBACK_URL,
      profileFields: ["id", "displayName", "emails", "photos"],
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        let user = await User.findOne({ facebookId: profile.id });

        const tokenExpiry = new Date();
        tokenExpiry.setSeconds(tokenExpiry.getSeconds() + 60 * 60 * 2); // 2 hours

        if (!user) {
          user = await User.create({
            facebookId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value || "noemail@facebook.com",
            avatar: profile.photos?.[0]?.value,
            isVerified: true,
            facebookAccessToken: accessToken,
            facebookTokenExpiry: tokenExpiry,
          });
        } else {
          // Update token if user exists
          user.facebookAccessToken = accessToken;
          user.facebookTokenExpiry = tokenExpiry;
          await user.save();
        }

        cb(null, user);
      } catch (error) {
        cb(error, null);
      }
    },
  ),
);
