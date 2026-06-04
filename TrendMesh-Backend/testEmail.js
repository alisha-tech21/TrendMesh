import dotenv from "dotenv";
dotenv.config();

import { sendVerificationEmail } from "./utils/email.js"; // path to your email.js

// Fake user object
const testUser = {
  name: "Test User",
  email: process.env.EMAIL_USER, // sends email to yourself first
  save: async function () {
    // simulate saving to DB
    console.log("User saved with token:", this.emailVerificationToken);
  },
};

// Call the function
sendVerificationEmail(testUser)
  .then(() => console.log("Test email function finished"))
  .catch((err) => console.error("Error in test:", err));
