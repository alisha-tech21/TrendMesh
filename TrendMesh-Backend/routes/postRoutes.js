import express from "express";
import FacebookPost from "../model/facebookPost.js";
import TwitterPost from "../model/twitterPost.js";
import InstagramPost from "../model/instagramPost.js";
import TikTokPost from "../model/tiktokPost.js";

const router = express.Router();

// GET: Sab platforms ki scheduled posts fetch karne ke liye
router.get("/all-scheduled", async (req, res) => {
  try {
    const query = { scheduledTime: { $ne: null } };

    const [fbPosts, twPosts, igPosts, tkPosts] = await Promise.all([
      FacebookPost.find(query),
      TwitterPost.find(query),
      InstagramPost.find(query),
      TikTokPost.find(query),
    ]);

    const combined = [
      ...fbPosts.map((p) => ({
        ...p._doc,
        platform: "facebook",
        start: p.scheduledTime,
      })),
      ...twPosts.map((p) => ({
        ...p._doc,
        platform: "twitter",
        start: p.scheduledTime,
      })),
      ...igPosts.map((p) => ({
        ...p._doc,
        platform: "instagram",
        start: p.scheduledTime,
      })),
      ...tkPosts.map((p) => ({
        ...p._doc,
        platform: "tiktok",
        start: p.scheduledTime,
      })),
    ];

    combined.sort(
      (a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime),
    );

    res.status(200).json({ success: true, posts: combined });
  } catch (err) {
    console.error("Combined Route Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT: Post ko calendar se reschedule karne ki API
router.put("/reschedule/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, platform, status } = req.body;

    let Model;
    if (platform === "facebook") Model = FacebookPost;
    else if (platform === "twitter") Model = TwitterPost;
    else if (platform === "instagram") Model = InstagramPost;
    else if (platform === "tiktok") Model = TikTokPost;
    else return res.status(400).json({ message: "Invalid Platform" });

    const existingPost = await Model.findById(id);
    if (!existingPost)
      return res.status(404).json({ message: "Post nahi mili" });

    // 💡 Logic Update: Date sync fix
    const [year, month, day] = newDate.split("-").map(Number);

    // Naya Date object purane time ke sath banayein
    const updatedDate = new Date(existingPost.scheduledTime);

    updatedDate.setFullYear(year);
    updatedDate.setMonth(month); // Frontend state se match karne ke liye direct month use karein
    updatedDate.setDate(day);

    // Waqt (Hours/Minutes) ko preserve karein taake post gayab na ho
    updatedDate.setHours(new Date(existingPost.scheduledTime).getHours());
    updatedDate.setMinutes(new Date(existingPost.scheduledTime).getMinutes());

    const finalStatus = status || "scheduled";

    const updatedPost = await Model.findByIdAndUpdate(
      id,
      {
        scheduledTime: updatedDate,
        status: finalStatus,
      },
      { new: true },
    );

    // Frontend ko confirmation ke liye return karein
    res.status(200).json({ success: true, post: updatedPost });
  } catch (error) {
    console.error("Reschedule Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
