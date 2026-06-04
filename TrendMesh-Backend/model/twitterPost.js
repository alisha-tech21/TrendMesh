import mongoose from "mongoose";

const twitterPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    tweetId: {
      type: String, // Twitter API tweet ID
    },

    title: String, // optional, like Facebook/Instagram
    message: {
      type: String,
      required: true,
    },
    cloudinary_id: {
      type: String,
      default: null,
    },
    imageUrl: String, // single image/video URL
    mediaType: {
      type: String,
      enum: ["IMAGE", "VIDEO", "GIF", "TEXT"],
      default: "TEXT",
    },

    likes: { type: Number, default: 0 },
    retweets: { type: Number, default: 0 },

    comments: [
      {
        message: String,
        from: String, // username of the replier
      },
    ],

    platforms: {
      type: [String], // ["twitter"] or multiple if needed later
      default: ["twitter"],
    },

    status: {
      type: String,
      enum: ["scheduled", "published", "failed"],
      default: "scheduled",
    },

    scheduledTime: Date,
    publishedAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model("TwitterPost", twitterPostSchema);
