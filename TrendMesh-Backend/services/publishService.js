import axios from "axios";
import FacebookPost from "../model/facebookPost.js";
import { postTweet } from "./twitterService.js";

/* ================================
   PUBLISH TO FACEBOOK
================================ */
async function publishFacebook(post) {
  try {
    console.log("Publishing to Facebook:", post.message);

    const pageId = post.pageId || process.env.FACEBOOK_PAGE_ID;
    const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    let fbResponse;

    // If post has image
    if (post.imageUrl) {
      const params = new URLSearchParams();
      params.append("url", post.imageUrl);
      params.append("caption", post.message);
      params.append("access_token", pageAccessToken);

      fbResponse = await axios.post(
        `https://graph.facebook.com/v24.0/${pageId}/photos`,
        params,
      );
    }
    // Text post
    else {
      const params = new URLSearchParams();
      params.append("message", post.message);
      params.append("access_token", pageAccessToken);

      fbResponse = await axios.post(
        `https://graph.facebook.com/v24.0/${pageId}/feed`,
        params,
      );
    }

    // Save Facebook post ID
    post.postId = fbResponse.data.id || fbResponse.data.post_id;
    console.log("Facebook Post Published:", post.postId);
    return true;
  } catch (error) {
    console.error(
      "Facebook Publish Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/* ================================
   PUBLISH TO INSTAGRAM
================================ */
async function publishInstagram(post) {
  try {
    console.log("Publishing to Instagram:", post.message);

    // Placeholder: Instagram Graph API integration can be added later
    // You can upload media & caption using IG Graph API

    return true;
  } catch (error) {
    console.error("Instagram Publish Error:", error.message);
    throw error;
  }
}

/* ================================
   PUBLISH TO TWITTER
================================ */
async function publishTwitter(post) {
  try {
    console.log("Publishing to Twitter:", post.message);
    await postTweet(post.message); // simple text tweet
    return true;
  } catch (error) {
    console.error("Twitter Publish Error:", error.message);
    throw error;
  }
}

/* ================================
   MAIN PUBLISH CONTROLLER
================================ */
export default async function publishPostToAllPlatforms(post) {
  try {
    if (!post.platforms || post.platforms.length === 0) {
      throw new Error("No platforms selected for publishing");
    }

    // Facebook
    if (post.platforms.includes("Facebook")) {
      await publishFacebook(post);
    }

    // Instagram
    if (post.platforms.includes("Instagram")) {
      await publishInstagram(post);
    }

    // Twitter (disabled if API credits not available)
    if (
      post.platforms.includes("Twitter") &&
      process.env.ENABLE_TWITTER === "true"
    ) {
      await publishTwitter(post);
    } else if (post.platforms.includes("Twitter")) {
      console.log("Twitter publishing skipped (API credits required)");
    }

    // Update status in DB
    post.status = "published";
    post.publishedAt = new Date();
    await post.save();

    console.log("Post marked as published on all selected platforms");
  } catch (error) {
    post.status = "failed";
    await post.save();

    console.error("Post marked as failed:", error.message);
    throw error;
  }
}
