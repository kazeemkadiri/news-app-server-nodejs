const mongoose = require("mongoose");
const NewsPostSchema = new mongoose.Schema(
  {
    postTitle: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    newsContent: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    published: Boolean,
  },
  { timestamps: { createdAt: "created_at" } }
);

const NewsPost = mongoose.model("newspost", NewsPostSchema);

module.exports = NewsPost;
