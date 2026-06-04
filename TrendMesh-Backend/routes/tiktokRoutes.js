import express from "express";
import axios from "axios";
import multer from "multer";
import fs from "fs";
import path from "path";
import TiktokPost from "../model/tiktokPost.js";

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Is se file ka asli extension (.mp4) barkarar rahega
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

let userAccessToken = process.env.TEMP_TIKTOK_TOKEN || "";

/* =======================
    1. AUTH ROUTES 
======================= */
router.get("/login", (req, res) => {
  const rootUrl = "https://www.tiktok.com/v2/auth/authorize/";
  const options = {
    client_key: process.env.TIKTOK_CLIENT_KEY,
    scope: "user.info.basic,video.list,video.upload,video.publish",
    response_type: "code",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI,
    state: "trendmesh_final",
  };
  const queryString = new URLSearchParams(options).toString();
  res.redirect(`${rootUrl}?${queryString}`);
});

router.get("/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const tokenResponse = await axios.post(
      "https://open.tiktokapis.com/v2/oauth/token/",
      new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: process.env.TIKTOK_REDIRECT_URI,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    userAccessToken = tokenResponse.data.access_token;
    console.log("🚀 TIKTOK ACCESS TOKEN:", userAccessToken);

    res.json({ success: true, token: userAccessToken });
  } catch (error) {
    console.error(
      "❌ Token Exchange Failed:",
      error.response?.data || error.message,
    );
    res.status(500).json({ error: "Token exchange failed" });
  }
});

/* =======================
    2. VIDEO MANAGEMENT 
======================= */
router.get("/videos", async (req, res) => {
  try {
    const posts = await TiktokPost.find({
      status: { $in: ["published", "scheduled"] },
    }).sort({ createdAt: -1 });
    const formattedVideos = posts.map((p) => {
      const cleanPath = p.imageUrl ? p.imageUrl.replace(/\\/g, "/") : "";

      return {
        _id: p._id,
        postId: p.publishId,
        media_url: cleanPath
          ? `http://localhost:5000/${cleanPath}`
          : "https://www.w3schools.com/html/mov_bbb.mp4",
        caption: p.message || "No caption",
        title: p.title || "No Title",
        status: p.status,
        timestamp: p.createdAt,
        view_count: p.view_count || 0,
        likes: p.likes || 0,
        shares: p.shares || 0,
        comments_count: p.comments_count || 0,
      };
    });

    res.json({ success: true, videos: formattedVideos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* =======================
    4. VIDEO UPLOAD 
======================= */
router.post("/upload", upload.single("video"), async (req, res) => {
  // Variables extraction
  const { accessToken, description, title, userId, scheduledTime } = req.body;
  const token = accessToken || userAccessToken;

  try {
    if (!token) {
      return res
        .status(401)
        .json({ error: "Access token is missing. Please login again." });
    }
    const videoPath = req.file ? req.file.path : req.body.videoPath;

    if (!videoPath || !fs.existsSync(videoPath)) {
      return res
        .status(404)
        .json({ error: "Video file not found. Please upload a video." });
    }

    if (scheduledTime) {
      console.log("📅 Scheduling post for:", scheduledTime);

      const now = new Date();
      const scheduled = new Date(scheduledTime);

      if (scheduled.getTime() <= now.getTime()) {
        return res.status(400).json({
          error: "Cannot schedule in past time",
        });
      }

      const newPost = await TiktokPost.create({
        userId: userId || null,
        title: title || "Scheduled Video",
        message: description || "No caption",
        imageUrl: videoPath.replace(/\\/g, "/"),
        mediaType: "video",
        status: "scheduled",
        accessToken: token,
        scheduledTime: scheduled, // 👈 FIXED
        platforms: ["tiktok"],
        view_count: 0,
        likes: 0,
        shares: 0,
        comments_count: 0,
      });

      return res.json({
        success: true,
        message: "Video scheduled successfully!",
        db_id: newPost._id,
      });
    }

    const stats = fs.statSync(videoPath);
    const videoSize = stats.size;

    // Step 1: Init TikTok Upload
    const initRes = await axios.post(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        post_info: {
          title:
            title || (description ? description.substring(0, 30) : "New Video"),
          privacy_level: "SELF_ONLY",
          video_description: description || "Uploaded via TrendMesh",
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: videoSize,
          total_chunk_count: 1,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          "Content-Type": "application/json",
        },
      },
    );

    const { upload_url, publish_id } = initRes.data.data;

    // --- STEP 2: BINARY PUT
    const videoStream = fs.createReadStream(videoPath);
    await axios.put(upload_url, videoStream, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": videoSize,
        "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Step 3: SAVE TO DATABASE
    const newPost = await TiktokPost.create({
      userId: userId || null,
      publishId: publish_id,
      title: title || req.body.title || "Untitled Video",
      message: description || "No caption",
      imageUrl: videoPath.replace(/\\/g, "/"),
      mediaType: "video",
      privacy: "SELF_ONLY",
      accessToken: accessToken,
      view_count: 0,
      likes: 0,
      shares: 0,
      comments_count: 0,
      platforms: ["tiktok"],
      status: "published",
      scheduledTime: scheduledTime || null,
      publishedAt: new Date(),
    });

    res.json({ success: true, publish_id, db_id: newPost._id });
  } catch (error) {
    console.error(
      "❌ TikTok API Error:",
      error.response?.data || error.message,
    );
    res.status(500).json({
      error: "Upload failed",
      details: error.response?.data || error.message,
    });
  }
});
/* =======================
    5. DELETE TIKTOK POST
======================= */
router.delete("/post/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await TiktokPost.findById(id);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "TikTok post not found" });
    }

    if (post.imageUrl && fs.existsSync(post.imageUrl)) {
      try {
        fs.unlinkSync(post.imageUrl);
      } catch (fileErr) {
        console.warn("File delete failed (Local):", fileErr.message);
      }
    }

    await TiktokPost.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "TikTok post and local file deleted successfully",
    });
  } catch (err) {
    console.error("Delete Error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

export default router;
