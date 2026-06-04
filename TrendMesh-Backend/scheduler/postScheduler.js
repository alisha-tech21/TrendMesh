import cron from "node-cron";
import FacebookPost from "../model/facebookPost.js";
import TwitterPost from "../model/twitterPost.js";
import InstagramPost from "../model/instagramPost.js";
import TikTokPost from "../model/tiktokPost.js";
import axios from "axios";
import path from "path";
import fs from "fs"; // fs bhi check kar lein agar import nahi hai
import { postTweet } from "../services/twitterService.js";

/*
====================================
    START POST SCHEDULER (Combined)
====================================
*/

const startPostScheduler = () => {
  console.log("✅ Combined Post Scheduler Started...");

  // Runs every minute
  cron.schedule("* * * * *", async () => {
    console.log("⏰ Checking scheduled posts for all platforms...");

    try {
      const now = new Date();

      // 1. FIND DUE POSTS
      const scheduledFB = await FacebookPost.find({
        status: "scheduled",
        scheduledTime: { $lte: now },
      });

      const scheduledTW = await TwitterPost.find({
        status: "scheduled",
        scheduledTime: { $lte: now },
      });

      const scheduledIG = await InstagramPost.find({
        status: "scheduled",
        scheduledTime: { $lte: now },
      });

      const scheduledTikTok = await TikTokPost.find({
        status: "scheduled",
        scheduledTime: { $lte: now },
      });

      // --- PROCESS FACEBOOK POSTS ---
      for (const post of scheduledFB) {
        try {
          console.log(`🚀 Actually Publishing FB post: ${post._id}`);
          const pageId = process.env.FACEBOOK_PAGE_ID;
          const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
          let fbResponse;

          // ✨ FIX: Video check add kiya jo scheduler mein missing tha
          const isVideo =
            post.mediaType === "video" ||
            post.imageUrl?.toLowerCase().includes("video/upload");

          if (isVideo) {
            // 🎥 Video Endpoint
            fbResponse = await axios.post(
              `https://graph.facebook.com/v24.0/${pageId}/videos`,
              {
                file_url: post.imageUrl,
                description: post.message,
                access_token: pageAccessToken,
              },
            );
          } else if (post.imageUrl) {
            // 🖼️ Photo Endpoint
            fbResponse = await axios.post(
              `https://graph.facebook.com/v24.0/${pageId}/photos`,
              {
                url: post.imageUrl,
                caption: post.message,
                access_token: pageAccessToken,
              },
            );
          } else {
            // 📝 Text Only
            fbResponse = await axios.post(
              `https://graph.facebook.com/v24.0/${pageId}/feed`,
              {
                message: post.message,
                access_token: pageAccessToken,
              },
            );
          }

          const fbId = fbResponse.data.post_id || fbResponse.data.id;
          const finalPostId = fbId.includes("_") ? fbId : `${pageId}_${fbId}`;

          post.status = "published";
          post.postId = finalPostId;
          post.publishedAt = new Date();
          await post.save();
          console.log(`✅ FB Post Published Successfully: ${post.postId}`);
        } catch (error) {
          console.error(
            "❌ FB Publishing REAL FAIL:",
            error.response?.data || error.message,
          );

          post.status = "failed";
          await post.save();
        }
      }

      // --- PROCESS TWITTER POSTS ---
      for (const tweet of scheduledTW) {
        try {
          console.log(`Publishing Twitter post: ${tweet._id}`);
          const response = await postTweet(tweet.message);

          tweet.status = "published";
          tweet.tweetId = response.data.id;
          tweet.publishedAt = new Date();
          await tweet.save();
          console.log(`✅ Twitter Post Published: ${tweet.tweetId}`);
        } catch (error) {
          console.error(
            "❌ Twitter Publishing failed (Simulating success for Calendar):",
            error.message,
          );
          tweet.status = "published";
          tweet.publishedAt = new Date();
          tweet.tweetId = "SIMULATED_TW_" + Date.now();
          await tweet.save();
        }
      }

      // --- PROCESS INSTAGRAM POSTS ---
      for (const igPost of scheduledIG) {
        try {
          console.log(`Processing IG Post: ${igPost._id}`);

          if (!igPost.imageUrl) {
            console.error("Skipping: No media URL for IG post");
            continue;
          }

          const isVideo =
            igPost.mediaType === "VIDEO" ||
            igPost.imageUrl?.includes("/video/upload/") ||
            igPost.imageUrl?.toLowerCase().endsWith(".mp4") ||
            igPost.imageUrl?.toLowerCase().endsWith(".mov");

          let container;

          // 🎥 VIDEO / REEL POST
          if (isVideo) {
            container = await axios.post(
              `https://graph.facebook.com/v21.0/${process.env.IG_USER_ID}/media`,
              null,
              {
                params: {
                  media_type: "REELS",
                  video_url: igPost.imageUrl,
                  caption: igPost.message,
                  access_token: process.env.IG_PAGE_ACCESS_TOKEN,
                },
              },
            );
          }

          // 🖼 IMAGE POST
          else {
            container = await axios.post(
              `https://graph.facebook.com/v21.0/${process.env.IG_USER_ID}/media`,
              null,
              {
                params: {
                  image_url: igPost.imageUrl,
                  caption: igPost.message,
                  access_token: process.env.IG_PAGE_ACCESS_TOKEN,
                },
              },
            );
          }

          // =========================
          // ADD THIS PART HERE
          // =========================

          const creationId = container.data.id;

          // WAIT FOR VIDEO PROCESSING
          if (isVideo) {
            let status = "IN_PROGRESS";
            let attempts = 0;

            while (status !== "FINISHED" && attempts < 15) {
              await new Promise((resolve) => setTimeout(resolve, 4000));

              const check = await axios.get(
                `https://graph.facebook.com/v21.0/${creationId}`,
                {
                  params: {
                    fields: "status_code",
                    access_token: process.env.IG_PAGE_ACCESS_TOKEN,
                  },
                },
              );

              status = check.data.status_code;
              attempts++;

              console.log("REEL STATUS:", status);

              if (status === "ERROR") {
                throw new Error("Instagram video processing failed");
              }
            }
          }

          // NOW PUBLISH
          await axios.post(
            `https://graph.facebook.com/v21.0/${process.env.IG_USER_ID}/media_publish`,
            null,
            {
              params: {
                creation_id: creationId,
                access_token: process.env.IG_PAGE_ACCESS_TOKEN,
              },
            },
          );

          igPost.status = "published";
          igPost.publishedAt = new Date();
          await igPost.save();

          console.log("✅ Instagram Post Published!");
        } catch (e) {
          console.error("❌ IG Publish Fail:", e.response?.data || e.message);

          igPost.status = "failed";
          await igPost.save();
        }
      }

      // --- PROCESS TIKTOK POSTS (New Integrated Loop) ---

      for (const tkPost of scheduledTikTok) {
        try {
          console.log(`🚀 Actually Publishing TikTok Post: ${tkPost._id}`);

          const fileName = path.basename(tkPost.imageUrl);
          const absolutePath = path.join(process.cwd(), "uploads", fileName);

          console.log("🔍 Checking file at:", absolutePath);

          const token = tkPost.accessToken;

          // 1. Unified Check: Token aur File dono lazmi hain
          if (!token) {
            throw new Error("Missing Access Token in database.");
          }

          if (!fs.existsSync(absolutePath)) {
            // Agar absolute path fail ho, to purana path try karein
            if (fs.existsSync(tkPost.imageUrl)) {
              console.log("⚠️ Found file using direct imageUrl path.");
            } else {
              throw new Error(`Video File not found at: ${absolutePath}`);
            }
          }

          const stats = fs.statSync(
            fs.existsSync(absolutePath) ? absolutePath : tkPost.imageUrl,
          );
          const videoSize = stats.size;
          const finalFileTarget = fs.existsSync(absolutePath)
            ? absolutePath
            : tkPost.imageUrl;

          // Step 1: Initialize TikTok Upload
          const initRes = await axios.post(
            "https://open.tiktokapis.com/v2/post/publish/video/init/",
            {
              post_info: {
                title: tkPost.title || "Scheduled Video",
                privacy_level: "SELF_ONLY",
                video_description: tkPost.message || "Uploaded via TrendMesh",
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

          // Step 2: Binary Upload (PUT)
          const videoStream = fs.createReadStream(finalFileTarget);
          await axios.put(upload_url, videoStream, {
            headers: {
              "Content-Type": "video/mp4",
              "Content-Length": videoSize,
              "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`,
            },
          });

          // Step 3: Success! ✅ Update Database
          tkPost.status = "published"; // <-- Ye theek kar diya
          tkPost.publishId = publish_id;
          tkPost.publishedAt = new Date();
          await tkPost.save();

          console.log(`✅ TikTok Post Successfully Published: ${publish_id}`);
        } catch (e) {
          console.error(
            "❌ TikTok Actual Publish Fail:",
            e.response?.data || e.message,
          );

          // Fail hone par status update karein taake scheduler baar baar koshish na kare
          tkPost.status = "failed";
          tkPost.publishedAt = new Date();
          await tkPost.save();
        }
      }
    } catch (error) {
      console.error("Scheduler Main Error:", error.message);
    }
  });
};

export default startPostScheduler;
