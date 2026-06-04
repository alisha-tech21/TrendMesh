import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    password: {
      type: String,
      select: false,
    },
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    facebookAccessToken: { type: String },
    facebookTokenExpiry: { type: Date },

    googleAccessToken: { type: String },
    googleRefreshToken: { type: String },

    otp: String,
    otpExpire: Date,
    isVerified: { type: Boolean, default: false },

    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    emailVerificationToken: { String },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
