import userModel from "../model/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { sendVerificationEmail } from "../utils/email.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
/// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found" });

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

    await transporter.sendMail({
      to: user.email,
      subject: "Reset Password",
      html: `<p>Hello ${user.name},</p>
             <p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/// Login Controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let errors = {};

    // Validate input
    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) errors.email = "Email Not Found";

    if (user) {
      if (!user.isVerified) {
        return res
          .status(401)
          .json({ message: "Please verify your email first (OTP required)." });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) errors.password = "Invalid Password";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }
    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Send response with user info
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Signup Controller
export const signup = async (req, res) => {
  try {
    console.log("Signup payload:", req.body);

    const { name, email, password } = req.body;

   const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS 
     ? process.env.ALLOWED_EMAILS.split(",") 
     : [];

if (!email || !ALLOWED_EMAILS.includes(email.toLowerCase())) {
      console.log("Unauthorized signup attempt:", email);
      return res.status(403).json({
        message: "Access Denied: This tool is restricted to authorized employees only.",
      });
    }

    if (!name || !email || !password) {
      console.log("Missing fields");
      return res.status(400).send({ message: "All fields are required" });
    }

    if (!/^[A-Za-z\s]+$/.test(name)) {
      console.log("Invalid name:", name);
      return res
        .status(400)
        .send({ message: "Name must contain only alphabets" });
    }

    if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      console.log("Invalid email:", email);
      return res.status(400).send({ message: "Invalid email format" });
    }

    if (password.length < 8) {
      console.log("Password too short:", password);
      return res
        .status(400)
        .send({ message: "Password must be at least 8 characters long" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      console.log("Email already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000;

    const hashedPassword = await bcrypt.hash(password, 10);
    // 2. Create User
    const newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpires,
      isVerified: false,
    });
    // 3. Send Email
    await transporter.sendMail({
      to: email,
      subject: "TrendMesh OTP Verification",
      html: `<h3>Welcome to TrendMesh!</h3>
             <p>Your Verification Code is: <b>${otp}</b></p>
             <p>This code expires in 5 minutes.</p>`,
    });

    console.log("New unverified user created:", newUser.email);

    res
      .status(201)
      .json({ message: "Signup successful", user: newUser, success: true });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: error.message, success: false });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await userModel.findOne({ emailVerificationToken: token });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = user.otp.toString() === otp.toString();
    const isExpired = user.otpExpires < Date.now();

    if (!isMatch || isExpired) {
      return res.status(400).json({
        message: isExpired ? "OTP has expired" : "Invalid OTP",
      });
    }

    // Verify user
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Verified successfully!", success: true });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
