import { TwitterApi } from "twitter-api-v2";
import dotenv from "dotenv";

dotenv.config();

// API Configuration
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

export async function postTweet(message) {
  try {
    // Check if keys exist in .env
    if (!process.env.TWITTER_API_KEY) {
      console.warn("Twitter Keys missing in .env. Simulating database save.");
      return { data: { id: "offline_" + Date.now() } };
    }

    const response = await client.v2.tweet(message);
    console.log("Tweet posted successfully!");
    return response;
  } catch (error) {
    // 💡 Agar credit nahi hai (403/401), to error throw karne ke bajaye mock ID bhejhein
    if (error.code === 403 || error.code === 400) {
      console.warn(
        "Twitter API Access Restricted (No Credits). Saving to DB only.",
      );
      return { data: { id: "simulated_" + Date.now() } };
    }
    console.error("Twitter Service Error:", error);
    throw error;
  }
}
