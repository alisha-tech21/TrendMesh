import express from "express";
import axios from "axios";
import { AuthApi } from "../middlware/AuthApi.js";
import ChatHistory from "../model/chatHistoryModel.js";

const router = express.Router();

router.post("/chat", AuthApi, async (req, res) => {
  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY.replace(/['"]/g, "").trim();

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const response = await axios.post(url, {
      system_instruction: {
        parts: [
          {
            text: `You are TrendMesh GPT, a professional social media strategist. 
      STRICT RULES:
      1. Tone: Sophisticated, modern, and concise.
      2. Length: Max 2 paragraphs. Provide ONLY one impactful caption if requested.
      3. Emojis: Use maximum 2-3 relevant emojis in the entire response. No emoji-spam.
      4. CTA: Always include a natural Call to Action (CTA) at the end (e.g., 'Link in bio', 'Save for later', or 'Share your thoughts').
      5. Hashtags: End with exactly 3 trending and relevant hashtags.
      6. Quality: Focus on high-value, professional growth and tech-savvy content.`,
          },
        ],
      },
      contents: [{ role: "user", parts: [{ text: message }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 500,
      },
    });

    if (response.data.candidates && response.data.candidates[0].content) {
      const aiReply = response.data.candidates[0].content.parts[0].text;

      // --- DATABASE SAVE LOGIC ---
      try {
        console.log("Attempting to save for User ID:", req.userid); // Debugging line

        await ChatHistory.create([
          { userId: req.userid, role: "user", content: message },
          { userId: req.userid, role: "assistant", content: aiReply },
        ]);

        console.log("History saved to MongoDB!");
      } catch (dbErr) {
        console.error("DB Save Error:", dbErr.message);
      }

      return res.status(200).json({ message: aiReply });
    } else {
      throw new Error("Invalid response format");
    }
  } catch (err) {
    console.error("API Error:", err.response?.data || err.message);
    res.status(500).json({ error: "AI failed to respond" });
  }
});

router.get("/history", AuthApi, async (req, res) => {
  try {
    // Sort by createdAt: 1 means oldest first (standard chat flow)
    const history = await ChatHistory.find({ userId: req.userid }).sort({
      createdAt: 1,
    });
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" });
  }
});
// Poori chat history delete karne ke liye
router.delete("/history", AuthApi, async (req, res) => {
  try {
    await ChatHistory.deleteMany({ userId: req.userid });
    res.status(200).json({ message: "Chat history cleared successfully!" });
  } catch (err) {
    console.error("Delete Error:", err.message);
    res.status(500).json({ message: "Failed to delete history" });
  }
});
// Single Message Delete
router.delete("/message/:id", AuthApi, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMessage = await ChatHistory.findOneAndDelete({
      _id: id,
      userId: req.userid, // Security: sirf apna message delete kar sakein
    });

    if (!deletedMessage) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json({ message: "Message deleted!" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
