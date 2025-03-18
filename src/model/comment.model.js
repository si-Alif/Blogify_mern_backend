import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      minlength: [2, "Comment must be at least 2 characters"],
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
      index: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Post reference is required"],
      index: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "flagged", "spam", "deleted"],
        message: "Invalid comment status",
      },
      default: "pending",
      index: true,
    },
    reports: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reason: {
          type: String,
          enum: ["spam", "abuse", "off-topic", "other"],
          required: true,
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    edited: {
      isEdited: {
        type: Boolean,
        default: false,
      },
      history: [
        {
          content: String,
          editedAt: Date,
        },
      ],
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for common query patterns
commentSchema.index({ createdAt: -1 });
commentSchema.index({ updatedAt: -1 });
commentSchema.index({ "reports.reportedAt": -1 });

// Virtuals
commentSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

commentSchema.virtual("replyCount", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentComment",
  count: true,
});

// Middleware for nested comments cleanup
commentSchema.pre("deleteMany", async function (next) {
  const comments = await this.model.find(this.getFilter());
  const commentIds = comments.map((c) => c._id);
  await mongoose.model("Comment").deleteMany({ parentComment: { $in: commentIds } });
  next();
});

// Text search index for comment content
commentSchema.index({ content: "text" });

// Query helpers
commentSchema.query.approved = function () {
  return this.where({ status: "approved" });
};

commentSchema.query.replies = function () {
  return this.where({ parentComment: { $ne: null } });
};

// Sanitization middleware
commentSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    // Basic XSS protection
    this.content = this.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    if (this.edited) {
      this.edited.history.push({
        content: this.content,
        editedAt: new Date(),
      });
      this.edited.isEdited = true;
    }
  }
  next();
});

export const Comment = mongoose.model("Comment", commentSchema);