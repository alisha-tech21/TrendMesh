import mongoose from "mongoose";

const instagramPostSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    igUserId: { type: String, required: true },
    postId: { type: String, required: false },
    title: String,
    message: String,
    imageUrl: String,
    mediaType: {
      type: String,
      enum: ["IMAGE", "VIDEO"],
      uppercase: true,
    },
    platforms: {
      type: [String],
      default: ["instagram"],
    },
    status: {
      type: String,
      enum: ["scheduled", "published", "failed"],
      default: "scheduled",
    },
    scheduledTime: {
      type: Date,
      required: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },

    likes: { type: Number, default: 0 },
    comments: [{ message: String, from: String }],
  },
  { timestamps: true },
);

export default mongoose.model("InstagramPost", instagramPostSchema);
