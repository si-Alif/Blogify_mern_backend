import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Invalid email address",
      },
      index: true,
    },

    avatar: {
      type: String,
      default: "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3467.jpg",

    },

    coverImage: {
      type: String,
      required:false,
      default: null, // Check if the field is being generated
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    refreshToken: {
      type: String,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin", "moderator" , "creator"],
      default: "user",
    },

    bio: {
      type: String,
      maxlength: 2000,
      default: "",
    },
    socialMediaHandles: [
      {
        platform: {
          type: String,
          enum: ["twitter", "facebook", "instagram", "linkedin", "youtube"],
          required: false,
          default: null
        },
        url: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+\/?/.test(v);
            },
            message: "Invalid URL",
          },
        },
      },
    ],


    posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    }],

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});



userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);

};

// JWT token generation methods
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      role: this.role,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY,
      algorithm:"RS512",

    },

  )
}

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id:this._id,
      username:this.username
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn:process.env.REFRESH_TOKEN_EXPIRY,
      algorithm:"HS256",
    }
  )
}

export const User = mongoose.model("User", userSchema);