import express from "express";
import passport from "passport";

import multer from "multer";
import path from "path";
import userModel from "../model/userModel.js";

import jwt from "jsonwebtoken";
import { signup, login } from "../controller/authController.js";
import { verifyOTP } from "../controller/authController.js";
import { verifyEmail } from "../controller/authController.js";
import { forgotPassword } from "../controller/authController.js";
import { resetPassword } from "../controller/authController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/verify-email/:token", verifyEmail);

// ==========================================
// 5. AVATAR ROUTE
// ==========================================
router.post("/update-avatar", upload.single("avatar"), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!req.file) return res.status(400).json({ message: "File nahi mili" });

    const avatarPath = `uploads/${req.file.filename}`;

    // Database mein update
    await userModel.findByIdAndUpdate(userId, { avatar: avatarPath });

    res.json({ success: true, avatarPath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
