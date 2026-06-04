import mongoose from "mongoose";

const facebookPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    pageId: {
      type: String,
      required: true,
    },
    postId: {
      type: String,
      required: false,
    },
    title: String,
    message: String,
    imageUrl: String,
    mediaType: {
      type: String,
      enum: ["IMAGE", "VIDEO", "TEXT"],
      default: "image",
    },
    created_time: Date,
    likes: { type: Number, default: 0 },
    comments: [
      {
        message: String,
        from: String,
      },
    ],
    platforms: {
      type: [String], // ["facebook","instagram"]
      default: ["facebook"],
    },

    status: {
      type: String,
      enum: ["scheduled", "published", "failed"],
      default: "scheduled",
    },
    // Store post IDs per platform (optional)
    facebookPostId: { type: String, default: null },
    twitterPostId: { type: String, default: null },
    instagramPostId: { type: String, default: null },

    scheduledTime: {
      type: Date,
      required: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("FacebookPost", facebookPostSchema);
