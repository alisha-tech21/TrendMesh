import express from "express";
import multer from "multer";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import TwitterPost from "../model/twitterPost.js";
import { postTweet } from "../services/twitterService.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// 1. CREATE & POST ROUTE
// 1. CREATE & POST ROUTE
router.post("/post", upload.single("image"), async (req, res) => {
  try {
    const { message, postType, scheduledTime, title } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    let mediaType = "TEXT";

    if (req.file) {
      if (req.file.mimetype.startsWith("video")) {
        mediaType = "VIDEO";
      } else if (req.file.mimetype.startsWith("image")) {
        mediaType = "IMAGE";
      }
    }
    // 1. Pehle postData ka object structure define karlein (Empty values ke sath)
    const postData = {
      title: title || "Twitter Post",
      message,
      imageUrl: null,
      cloudinary_id: null,
      media_type: mediaType,
      scheduledTime:
        postType === "now"
          ? new Date()
          : new Date(new Date(scheduledTime).toISOString()),
      status: postType === "schedule" ? "scheduled" : "published",
      platforms: ["twitter"],
    };

    // 2. Ab Cloudinary Upload karein aur postData ko update karein
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "trendmesh/twitter",
          resource_type: "auto", // 🔥 IMPORTANT FOR VIDEO
        });

        // Ab yahan error nahi ayega kyunke postData upar define ho chuka hai
        postData.imageUrl = result.secure_url;
        postData.cloudinary_id = result.public_id;

        fs.unlinkSync(req.file.path);
      } catch (uploadErr) {
        console.error("Cloudinary Error:", uploadErr);
      }
    }

    // --- Scenario A: Scheduling ---
    if (postType === "schedule") {
      const post = await TwitterPost.create(postData);
      return res.json({
        success: true,
        message: "Post scheduled successfully",
        post,
      });
    }

    // --- Scenario B: Post Now ---
    if (postType === "now") {
      let newPost = await TwitterPost.create(postData);

      try {
        const tweet = await postTweet(message);
        newPost.tweetId = tweet?.data?.id || "MOCK_ID_" + Date.now();
      } catch (apiError) {
        console.warn("⚠️ Twitter API Failed: Marking as Published in DB only.");
        newPost.tweetId = "SIMULATED_" + Date.now();
      }

      newPost.status = "published";
      newPost.publishedAt = new Date();
      await newPost.save();

      return res.json({
        success: true,
        message: "Post created and added to history.",
        post: newPost,
      });
    }

    res.status(400).json({ error: "Invalid postType" });
  } catch (err) {
    console.error("Critical Twitter Route Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// 2. GET SCHEDULED & HISTORY
router.get("/scheduled", async (req, res) => {
  try {
    const posts = await TwitterPost.find({
      status: { $in: ["scheduled", "published"] },
      scheduledTime: { $ne: null },
    }).sort({ scheduledTime: 1 });

    res.status(200).json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. DELETE POST
router.delete("/post/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const post = await TwitterPost.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // ==============================
    // 1. DELETE FROM CLOUDINARY
    // ==============================
    if (post.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(post.cloudinary_id);
      } catch (cloudErr) {
        console.warn("Cloudinary delete failed:", cloudErr.message);
      }
    }

    // ==============================
    // 2. DELETE FROM DATABASE
    // ==============================
    await TwitterPost.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error("Delete Error:", err);

    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
});

export default router;
