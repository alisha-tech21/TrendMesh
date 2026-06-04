import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db/connectdb.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import "./config/passport.js";
import facebookRoutes from "./routes/facebookRoutes.js";
import instagramRoutes from "./routes/instagramRoutes.js";
import aiRoutes from "./routes/ai.js";
import startPostScheduler from "./scheduler/postScheduler.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import twitterRoutes from "./routes/twitterRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import postActions from "./routes/postActions.js";
import tiktokRoutes from "./routes/tiktokRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

// =======================
// Placeholder routes for Terms & Privacy (required for Twitter app URLs)
// =======================
app.get("/terms", (req, res) => {
  res.send("Terms of Service placeholder");
});

app.get("/privacy", (req, res) => {
  res.send("Privacy Policy placeholder");
});

app.post("/facebook/deauthorize", (req, res) => {
  res.sendStatus(200);
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// Server file mein check karein ye line hai ya nahi

app.use("/api/ai", aiRoutes);
app.use("/api/facebook", facebookRoutes);
app.use("/api/instagram", instagramRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/twitter", twitterRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/posts", postActions);
app.use("/api/tiktok", tiktokRoutes);
app.use("/api/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  startPostScheduler();
});
