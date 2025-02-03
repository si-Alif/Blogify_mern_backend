import { User } from "../model/user.model.js";
import {
  API_ERROR,
  asyncHandler,
  API_Response,
  cloudinaryFileUpload
} from "../utils/index.js";

const registerUser = asyncHandler(async (req, res, next) => {
  const { username, email, password, fullName } = req.body;

  const validationErrors = [];

  if (!username?.trim()) validationErrors.push({ field: "username", message: "Username is required" });
  if (!email?.trim()) validationErrors.push({ field: "email", message: "Email is required" });
  if (!password?.trim()) validationErrors.push({ field: "password", message: "Password is required" });
  if (!fullName?.trim()) validationErrors.push({ field: "fullName", message: "Full Name is required" });

  if (validationErrors.length) {
    throw new API_ERROR(
      "All fields are required and cannot be empty",
      400,
      {
        validationErrors,
        errorCode: "validation_error",
        path: req.originalUrl,
      }
    );
  }

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existingUser) {
    const conflictingKey = existingUser.username === username ? "username" : "email";

    throw new API_ERROR(
      `A user with this ${conflictingKey} already exists`,
      409,
      {
        errorCode: "conflicting_user",
        cause: [`User with this ${conflictingKey} already exists`],
        path: req.originalUrl,
        data: { [conflictingKey]: existingUser[conflictingKey] }
      }
    );
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new API_ERROR("No avatar uploaded", 400, {
      errorCode: "no_avatar",
      path: req.originalUrl,
      cause: "No avatar uploaded",
    });
  }

  let avatarURI, coverImageURI;

  try {
    avatarURI = await cloudinaryFileUpload(avatarLocalPath);
  } catch (error) {
    throw new API_ERROR("Failed to upload avatar", 500, {
      errorCode: "upload_error",
      path: req.originalUrl,
      cause: error?.message,
      data: { localPath: avatarLocalPath },
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
    });
  }

  if (coverImageLocalPath) {
    try {
      coverImageURI = await cloudinaryFileUpload(coverImageLocalPath);
    } catch (error) {
      throw new API_ERROR("Failed to upload cover image", 500, {
        errorCode: "upload_error",
        path: req.originalUrl,
        cause: error?.message,
        data: { localPath: coverImageLocalPath },
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      });
    }
  }

  const newUser = await User.create({
    username,
    email,
    password,
    fullName,
    avatar: avatarURI?.secure_url || null,
    coverImage: coverImageURI?.secure_url || null,
    role: "user",
    verified: false,
  })

  if (!newUser) {
    throw new API_ERROR("Failed to create user", 500, {
      errorCode: "create_user_error",
      path: req.originalUrl,
      cause: "Database failed to create user",
      stack: process.env.NODE_ENV === "development" ? new Error().stack : undefined,
    });
  }

  return res.status(201).json(
    API_Response.success(
      { user: newUser },
      {
        statusCode: 201,
        message: "User registered successfully",
        path: req.originalUrl,
        cause: "User registration failed",
        meta: {
          timestamp: new Date().toISOString(),

        }
      }
    )
  );

});

export { registerUser };
