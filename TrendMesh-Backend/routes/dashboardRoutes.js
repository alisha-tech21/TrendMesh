import express from "express";
import axios from "axios";
const router = express.Router();

router.get("/combined-stats", async (req, res) => {
  const FB_PAGE_ID = process.env.FB_PAGE_ID;
  const IG_USER_ID = process.env.IG_USER_ID;
  const FB_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const IG_TOKEN = process.env.IG_PAGE_ACCESS_TOKEN;
  const TT_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
  const TW_TOKEN = process.env.TWITTER_ACCESS_TOKEN;

  console.log("Current Page ID:", FB_PAGE_ID);
  console.log("Token length:", FB_TOKEN?.length);

  try {
    // 1. Facebook Data Fetch
    const fbUrl = `https://graph.facebook.com/v21.0/${FB_PAGE_ID}?fields=followers_count,posts.limit(100){likes.summary(true),comments.summary(true)}&access_token=${FB_TOKEN}`;
    const fbRes = await axios.get(fbUrl).catch((err) => {
      console.error("FB Fetch Error:", err.response?.data || err.message);
      return { data: { followers_count: 0, posts: { data: [] } } };
    });

    const fbFollowers = Number(fbRes.data.followers_count || 0);
    let fbLikes = 0;
    let fbComments = 0;
    const fbPosts = fbRes.data.posts?.data || [];
    fbPosts.forEach((p) => {
      fbLikes += Number(p.likes?.summary?.total_count || 0);
      fbComments += Number(p.comments?.summary?.total_count || 0);
    });

    // 2. Instagram Data Fetch
    const igUrl = `https://graph.facebook.com/v21.0/${IG_USER_ID}?fields=followers_count,media.limit(100){like_count,comments_count}&access_token=${IG_TOKEN}`;
    const igRes = await axios.get(igUrl).catch((err) => {
      console.error("IG Fetch Error:", err.response?.data || err.message);
      return { data: { followers_count: 0, media: { data: [] } } };
    });

    const igFollowers = Number(igRes.data.followers_count || 0);
    let igLikes = 0;
    let igComments = 0;
    const igMedia = igRes.data.media?.data || [];
    igMedia.forEach((m) => {
      igLikes += Number(m.like_count || 0);
      igComments += Number(m.comments_count || 0);
    });

    // 3. TikTok Data Fetch
    const ttUrl = `https://open.tiktokapis.com/v2/user/info/?fields=follower_count,like_count`;
    const ttRes = await axios
      .get(ttUrl, {
        headers: { Authorization: `Bearer ${TT_TOKEN}` },
      })
      .catch((err) => {
        console.error("TikTok Fetch Error:", err.response?.data || err.message);
        return {
          data: { data: { user: { follower_count: 0, like_count: 0 } } },
        };
      });

    const ttFollowers = Number(ttRes.data.data?.user?.follower_count || 0);
    const ttLikes = Number(ttRes.data.data?.user?.like_count || 0);

    // 4. Twitter (X) Data Fetch
    const twUrl = `https://api.twitter.com/2/users/me?user.fields=public_metrics`;
    const twRes = await axios
      .get(twUrl, {
        headers: { Authorization: `Bearer ${TW_TOKEN}` },
      })
      .catch((err) => {
        console.error(
          "Twitter Fetch Error:",
          err.response?.data || err.message,
        );
        return {
          data: {
            data: { public_metrics: { followers_count: 0, tweet_count: 0 } },
          },
        };
      });

    const twFollowers = Number(
      twRes.data.data?.public_metrics?.followers_count || 0,
    );
    const twTweets = Number(twRes.data.data?.public_metrics?.tweet_count || 0);

    // 5. Calculation Logic - converting to numbers for Sum
    const fbEng =
      fbPosts.length > 0
        ? parseFloat(((fbLikes + fbComments) / fbPosts.length).toFixed(2))
        : 0;
    const igEng =
      igMedia.length > 0
        ? parseFloat(((igLikes + igComments) / igMedia.length).toFixed(2))
        : 0;
    const ttEng =
      ttFollowers > 0 ? parseFloat((ttLikes / ttFollowers).toFixed(2)) : 0;
    const twEng =
      twFollowers > 0 ? parseFloat((twTweets / twFollowers).toFixed(2)) : 0;

    const responseData = {
      facebook: { followers: fbFollowers, likes: fbLikes, engagement: fbEng },
      instagram: { followers: igFollowers, likes: igLikes, engagement: igEng },
      tiktok: { followers: ttFollowers, likes: ttLikes, engagement: ttEng },
      twitter: { followers: twFollowers, tweets: twTweets, engagement: twEng },
      all: {
        followers: fbFollowers + igFollowers + ttFollowers + twFollowers,
        likes: fbLikes + igLikes + ttLikes,
        engagement: (fbEng + igEng + ttEng + twEng).toFixed(2),
      },
    };

    console.log("Real Data Sent Successfully!");
    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error("Route Crash Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
