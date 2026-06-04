import mongoose from "mongoose";

const tiktokPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    publishId: { type: String, default: null },
    title: String,
    message: String,

    // In dono fields ko ensure karein ke controller se data pass ho raha ho
    videoUrl: { type: String, required: false },
    imageUrl: { type: String, required: false }, // Uniformity ke liye add kiya
    cloudinary_id: { type: String, required: false },

    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    view_count: { type: Number, default: 0 },

    platforms: {
      type: [String],
      default: ["tiktok"], // Case-insensitive consistency ke liye lowercase
    },
    status: {
      type: String,
      enum: ["scheduled", "published", "failed"],
      default: "scheduled",
    },
    accessToken: { type: String },
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

export default mongoose.model("TiktokPost", tiktokPostSchema);
