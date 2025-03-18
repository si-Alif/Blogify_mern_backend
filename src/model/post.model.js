import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    minlength: [5, "Title must be at least 5 characters"],
    maxlength: [120, "Title cannot exceed 120 characters"],
    index: "text",
    unique: true
  },
  slug: {
    type: String,
    index :true,
    required: [true, "Slug is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, "Slug must contain only letters, numbers, and hyphens"]
  },
  content: {
    type: String,
    required: [true, "Content is required"],
    trim: true,
    minlength: [20, "Content must be at least 20 characters"],
    maxlength: [20000, "Content cannot exceed 20,000 characters"]
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: [300, "Excerpt cannot exceed 300 characters"]
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ["draft", "published", "archived"],
      message: "Invalid post status"
    },
    default: "draft"
  },
  tags: [{
    type: String,
    trim: false,
    lowercase: true,
    maxlength: [30, "Tag cannot exceed 30 characters"]
  }],
  featuredImages: [{
    url:{
      type: String,
      // required: [true, "Featured image URL is required"],
    },
    credit:{
      type: String,
      default:"Unknown 👀",
      maxlength: [100, "Credit cannot exceed 100 characters"]

    },
    altText: {
      type: String,
      maxlength: [125, "Alt text cannot exceed 125 characters"]
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: []
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: []
  }],
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, "Meta title cannot exceed 60 characters"]
    },
    metaDescription: {
      type: String,
      maxlength: [160, "Meta description cannot exceed 160 characters"]
    }
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ["technology", "lifestyle", "business", "entertainment", "other"],
    default: "other",
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ views: -1 });

postSchema.virtual("likeCount").get(function() {
  return this.likes.length;
});

postSchema.virtual("commentCount").get(function() {
  return this.comments.length;
});

postSchema.virtual("readingTime").get(function() {
  const wordsPerMinute = 175;
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
});


postSchema.query.published = function() {
  return this.where({ status: "published" });
};

export const Post = mongoose.model("Post", postSchema);