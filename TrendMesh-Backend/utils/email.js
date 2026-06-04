import crypto from "crypto";
import { transporter } from "./transporter.js"; // your actual transporter file

export const sendVerificationEmail = async (user) => {
  const token = crypto.randomBytes(32).toString("hex");
  user.emailVerificationToken = token;
  await user.save();

  const verificationLink = `${process.env.CLIENT_URL}/verify-email/${token}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Verify Your Email",
      html: `<p>Hello ${user.name},</p>
             <p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
      text: `Hello ${user.name},\nVerify your email: ${verificationLink}`,
    });
    console.log(`Verification email sent to ${user.email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};
