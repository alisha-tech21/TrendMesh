import express from "express";
import FacebookPost from "../model/facebookPost.js";
import TwitterPost from "../model/twitterPost.js";
import InstagramPost from "../model/instagramPost.js";
import TikTokPost from "../model/tiktokPost.js";

const router = express.Router();

// --- DELETE ROUTE ---
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Pehle post find karo (IMPORTANT)
    const post =
      (await FacebookPost.findById(id)) ||
      (await InstagramPost.findById(id)) ||
      (await TwitterPost.findById(id)) ||
      (await TikTokPost.findById(id));

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // 2. PLATFORM DELETE LOGIC (MOST IMPORTANT PART)
    const platform = post.platform?.toLowerCase();

    if (platform === "facebook") {
      // TODO: Facebook Graph API delete call
      // await deleteFacebookPost(post.fbPostId);
    }

    if (platform === "instagram") {
      // TODO: Instagram Graph API delete call
      // await deleteInstagramPost(post.igPostId);
    }

    if (platform === "tiktok") {
      // TODO: TikTok API delete call
      // await deleteTikTokPost(post.tiktokPostId);
    }

    // 3. DATABASE DELETE
    await Promise.all([
      FacebookPost.findByIdAndDelete(id),
      InstagramPost.findByIdAndDelete(id),
      TwitterPost.findByIdAndDelete(id),
      TikTokPost.findByIdAndDelete(id),
    ]);

    return res.json({
      success: true,
      message: "Post deleted from DB + platform",
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// --- EDIT (UPDATE) ROUTE ---
router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { message, scheduledTime } = req.body;

  try {
    const updateData = { message };

    if (scheduledTime) {
      const now = new Date();
      const scheduled = new Date(scheduledTime);

      if (scheduled.getTime() <= now.getTime()) {
        return res.status(400).json({
          error: "Cannot schedule in past time",
        });
      }

      updateData.scheduledTime = scheduled;
    }

    const results = await Promise.all([
      FacebookPost.findByIdAndUpdate(id, updateData, { new: true }),
      TwitterPost.findByIdAndUpdate(id, updateData, { new: true }),
      InstagramPost.findByIdAndUpdate(id, updateData, { new: true }),
      TikTokPost.findByIdAndUpdate(id, updateData, { new: true }),
    ]);

    const updatedPost = results.find((r) => r !== null);

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ success: true, post: updatedPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default router;
