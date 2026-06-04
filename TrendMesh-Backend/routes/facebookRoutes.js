import express from "express";
import multer from "multer";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import FacebookPost from "../model/facebookPost.js";
import axios from "axios";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Helper: ID se numerical part nikalne ke liye (Safe approach)
const extractNumericalId = (id) => {
  if (!id) return null;
  const strId = String(id);
  return strId.includes("_") ? strId.split("_")[1] : strId;
};

/* ======================
    GET CURRENT FB USER
======================= */
router.get("/me", async (req, res) => {
  try {
    const response = await axios.get("https://graph.facebook.com/v21.0/me", {
      params: {
        fields: "id,name",
        access_token: process.env.FACEBOOK_USER_ACCESS_TOKEN,
      },
    });
    res.status(200).json({ success: true, account: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =======================
    GET USER PAGES
======================= */
router.get("/pages", async (req, res) => {
  try {
    const response = await axios.get(
      "https://graph.facebook.com/v21.0/me/accounts",
      {
        params: {
          access_token: process.env.FACEBOOK_USER_ACCESS_TOKEN,
          fields: "id,name,category,picture{url},access_token",
        },
      },
    );
    res.status(200).json({ success: true, pages: response.data.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =======================
    CREATE FACEBOOK POST
======================= */
router.post("/post", upload.any(), async (req, res) => {
  try {
    let {
      title,
      message,
      scheduledTime,
      postType,
      platforms,
      imageUrl,
      mediaType,
    } = req.body;

    // Platforms ko parse karein agar string mein hain
    if (typeof platforms === "string") platforms = JSON.parse(platforms);

    // Validation
    if (
      !title ||
      !message ||
      !postType ||
      !platforms ||
      platforms.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    // Image upload logic
    if (req.files && req.files.length > 0) {
      const file = req.files[0];
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "trendmesh",
        resource_type: "auto", // ✨ Yeh line video upload enable karegi
      });
      imageUrl = result.secure_url;
      fs.unlinkSync(file.path);
    }

    // Data prepare karein
    const postData = {
      title,
      message,
      imageUrl: imageUrl || null,
      mediaType: mediaType || (imageUrl?.includes("video") ? "VIDEO" : "IMAGE"), // Fallback logic
      platforms,
      pageId: process.env.FACEBOOK_PAGE_ID,
      scheduledTime: scheduledTime
        ? new Date(new Date(scheduledTime).toISOString())
        : null,
      created_time: new Date(),
    };

    // ==========================================
    // CASE 1: Schedule Post (Sirf DB mein save)
    // ==========================================
    if (postType === "schedule") {
      const scheduledPost = await FacebookPost.create({
        ...postData,
        status: "scheduled", // Explicitly setting status
        postId: "SCHEDULED_" + Date.now(),
        publishedAt: null, // Taki cron job ko pata chale ye abhi publish nahi hui
      });

      return res.status(200).json({
        success: true,
        message: "Post scheduled successfully in DB",
        result: scheduledPost,
      });
    }

    // ==========================================
    // CASE 2: Publish Now (Foran Account par)
    // ==========================================
    if (postType === "now") {
      try {
        // 1. DB mein save karein status "published" ke sath
        const newPost = await FacebookPost.create({
          ...postData,
          status: "published",
        });

        // 2. Foran saare platforms par publish karein
        await publishPostToAllPlatforms(newPost);

        return res.status(200).json({
          success: true,
          message: "Post published on selected platforms",
          result: newPost,
        });
      } catch (err) {
        console.error("Publish Error:", err);
        return res
          .status(500)
          .json({ success: false, error: "Failed to publish" });
      }
    }

    return res.status(400).json({ success: false, error: "Invalid postType" });
  } catch (err) {
    console.error("Post Route Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});
/* =======================
    GET PAGE POSTS (Matching Fix)
======================= */
/* =======================
    GET PAGE POSTS (The Real Fix)
======================= */
router.get("/posts/:pageId", async (req, res) => {
  const { pageId } = req.params;
  try {
    const storedPosts = await FacebookPost.find({ pageId });
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    const fbResponse = await axios.get(
      `https://graph.facebook.com/v21.0/${pageId}/posts`,
      {
        params: {
          access_token: accessToken,
          fields:
            "id,message,created_time,attachments{media,type,url},full_picture,likes.summary(true),comments{message,from}",
        },
      },
    );

    const livePosts = fbResponse.data.data.map((p) => {
      // Masla yahan tha: Humain har tarah ki ID check karni hai
      const fbLongId = p.id; // e.g., "86725..._1221..."
      const fbShortId = p.id.includes("_") ? p.id.split("_")[1] : p.id; // e.g., "1221..."

      const stored = storedPosts.find((s) => {
        // Database ke postId ko dono formats se match karein
        return (
          s.postId === fbLongId ||
          s.postId === fbShortId ||
          s.facebookPostId === fbLongId ||
          s.facebookPostId === fbShortId
        );
      });
      const attachment = p.attachments?.data[0];

      const isVideoType =
        attachment?.type === "video_inline" ||
        attachment?.type === "video_autoplay" ||
        attachment?.type === "video";

      const mediaUrl =
        stored?.imageUrl || attachment?.media?.source || p.full_picture || null;
      return {
        // AGAR STORED MILA HAI TOH MONGO ID BHEJEIN, WARNA FB KI ID
        _id: stored ? stored._id.toString() : p.id,
        postId: p.id,
        message: p.message || "",
        created_time: p.created_time,
        imageUrl: mediaUrl,
        likes: p.likes?.summary?.total_count || 0,
        title: stored ? stored.title : "Facebook Post",
        fromDb: !!stored, // Yeh sirf debug ke liye hai ke record DB se link hua ya nahi
        mediaType: isVideoType ? "VIDEO" : stored ? stored.mediaType : "IMAGE",
      };
    });

    res.status(200).json({ success: true, posts: livePosts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
/* =======================
    DELETE FACEBOOK POST (Database Structure Fixed)
======================= */
router.delete("/post/:postId", async (req, res) => {
  const { postId } = req.params;
  console.log("🗑️ Request to delete ID:", postId);

  try {
    // 1. Pehle Database mein record dhoondo (Har tarah ki ID se)
    const post = await FacebookPost.findOne({
      $or: [
        { _id: postId.match(/^[0-9a-fA-F]{24}$/) ? postId : null }, // MongoDB hex ID
        { postId: postId }, // Long ID (86725..._1221...)
        { postId: postId.includes("_") ? postId.split("_")[1] : postId }, // Short ID
      ].filter(Boolean),
    });

    if (!post) {
      console.log("⚠️ Post DB mein nahi mili.");
      return res
        .status(404)
        .json({ success: false, error: "Record not found in database." });
    }

    // 2. Facebook ki Real ID nikaalein (Deletion ke liye)
    const pageId = post.pageId || process.env.FACEBOOK_PAGE_ID;
    const realFacebookId = post.postId.includes("_")
      ? post.postId
      : `${pageId}_${post.postId}`;

    console.log("📡 Sending delete request to FB for ID:", realFacebookId);

    // 3. Facebook Graph API se delete karein
    try {
      await axios.delete(`https://graph.facebook.com/v21.0/${realFacebookId}`, {
        params: { access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN },
      });
      console.log("✅ Facebook account se delete ho gayi.");
    } catch (fbErr) {
      console.log("ℹ️ FB cleanup skipped or already deleted on FB.");
    }

    // 4. 🔥 DATABASE SE DELETE (Asli Fix)
    // Hum post._id use karenge jo humne step 1 mein dhoondi hai
    await FacebookPost.findByIdAndDelete(post._id);
    console.log("🎯 SUCCESS: Database record removed!");

    res.status(200).json({
      success: true,
      message: "Post account aur database dono se delete ho gayi.",
    });
  } catch (err) {
    console.error("❌ Final Delete Error:", err.message);
    res.status(500).json({ success: false, error: "Deletion failed." });
  }
});
/* ==========================================
   HELPER: ACTUAL PUBLISH LOGIC FOR FACEBOOK
   (Iske baghair "Publish Now" kaam nahi karega)
   ========================================== */
/* ==========================================
   HELPER: ACTUAL PUBLISH LOGIC FOR FACEBOOK (Fixed for Videos)
   ========================================== */
async function publishPostToAllPlatforms(post) {
  try {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    let response;

    // Video extension check karne ke liye logic
    const isVideo =
      post.mediaType === "VIDEO" ||
      post.imageUrl?.toLowerCase().includes("video/upload");

    if (isVideo) {
      console.log("🎥 Detecting as VIDEO. Sending to /videos endpoint...");
      // 🎥 Case: Video Publish
      response = await axios.post(
        `https://graph.facebook.com/v21.0/${pageId}/videos`,
        {
          file_url: post.imageUrl, // Cloudinary link
          description: post.message, // Videos ke liye 'description' use hota hai
          access_token: accessToken,
        },
      );
    } else if (post.imageUrl) {
      // 🖼️ Case: Image Publish (Aapka purana logic)
      response = await axios.post(
        `https://graph.facebook.com/v21.0/${pageId}/photos`,
        {
          url: post.imageUrl,
          message: post.message,
          access_token: accessToken,
        },
      );
    } else {
      // 📝 Case: Text Only (Aapka purana logic)
      response = await axios.post(
        `https://graph.facebook.com/v21.0/${pageId}/feed`,
        {
          message: post.message,
          access_token: accessToken,
        },
      );
    }

    const fbId = response.data.post_id || response.data.id;
    const finalPostId = fbId.includes("_") ? fbId : `${pageId}_${fbId}`;

    await FacebookPost.findByIdAndUpdate(post._id, {
      postId: finalPostId,
      facebookPostId: finalPostId,
      status: "published",
      publishedAt: new Date(),
    });

    console.log("✅ Facebook API Success:", response.data);
    return response.data;
  } catch (err) {
    console.error(
      "❌ Facebook API Error Details:",
      err.response?.data || err.message,
    );
    throw new Error(
      err.response?.data?.error?.message || "Facebook Publishing Failed",
    );
  }
}
export default router;
