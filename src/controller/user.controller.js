import { User } from "../model/user.model.js";
import {
  API_ERROR,
  asyncHandler,
  API_Response,
  cloudinaryFileUpload,
} from "../utils/index.js";
import { cookie_Options } from "../constants.js";
import jwt from "jsonwebtoken"



const registerUser = asyncHandler(async (req, res, next) => {
  const {
    username,
    email,
    password,
    fullName,
    bio,
    socialMediaHandles,
    posts,
  } = req.body;

  const validationErrors = [];

  console.log(req.files);

  if (!username?.trim())
    validationErrors.push({
      field: "username",
      message: "Username is required",
    });
  if (!email?.trim())
    validationErrors.push({ field: "email", message: "Email is required" });
  if (!password?.trim())
    validationErrors.push({
      field: "password",
      message: "Password is required",
    });
  if (!fullName?.trim())
    validationErrors.push({
      field: "fullName",
      message: "Full Name is required",
    });

  if (validationErrors.length) {
    throw new API_ERROR("All fields are required and cannot be empty", 400, {
      validationErrors,
      errorCode: "validation_error",
      path: req.originalUrl,
    });
  }

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existingUser) {
    const conflictingKey =
      existingUser.username === username ? "username" : "email";

    throw new API_ERROR(
      `A user with this ${conflictingKey} already exists`,
      409,
      {
        errorCode: "conflicting_user",
        cause: [`User with this ${conflictingKey} already exists`],
        path: req.originalUrl,
        data: { [conflictingKey]: existingUser[conflictingKey] },
      },
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
        stack:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
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
    bio,
    socialMediaHandles,
    posts: posts,
  });

  if (!newUser) {
    throw new API_ERROR("Failed to create user", 500, {
      errorCode: "create_user_error",
      path: req.originalUrl,
      cause: "Database failed to create user",
      stack:
        process.env.NODE_ENV === "development" ? new Error().stack : undefined,
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
        },
      },
    ),
  );
});

const loginUser = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  console.log(email);

  const validationErrors = [];
  if (!username?.trim() && !email?.trim())
    validationErrors.push({
      field: "usernameOrEmail",
      message: "Username or Email is required",
    });

  if (!password?.trim())
    validationErrors.push({
      field: "password",
      message: "Password is required",

    });

  if (validationErrors.length) {
    throw new API_ERROR("All fields are required and cannot be empty", 400, {
      validationErrors,
      errorCode: "validation_error",
      path: req.originalUrl,
    });
  }

  const user = await User.findOne({
    $or: [{ username: username }, { email: email }],
  });

  if (!user)
    throw new API_ERROR(`No user found with this username or email`, 404, {
      errorCode: "user_not_found",
      path: req.originalUrl,
      cause: `No user found with this username or email`,
    });

  const authenticatedUser = await user.isPasswordCorrect(password);

  if (!authenticatedUser)
    throw new API_ERROR("Invalid credentials", 401, {
      errorCode: "invalid_credentials",
      path: req.originalUrl,
      cause: "Invalid Password",
    });

  const access_token = user?.generateAccessToken();
  const refresh_token = user?.generateRefreshToken();

  // user.refreshToken = refresh_token;
  // await user.save({ validateBeforeSave: false });

  const updateduser = await User.findByIdAndUpdate(
    user._id,
    { refreshToken: refresh_token },
    { new: true }
  ).select("-password -refreshToken")


  const loggedInUser = await User.findOne(user?._id);
  return res
    .status(200)
    .cookie("accessToken", access_token, cookie_Options)
    .cookie("refreshToken", refresh_token, cookie_Options)
    .json(
      API_Response.success(
        { user: updateduser },
        {
          statusCode: 200,
          message: "User logged in successfully",
          meta: {
            timestamp: new Date().toISOString(),

          },
        },
      ),

    );
});

const logoutUser = asyncHandler(async (req, res, next) => {
  const user = req?.user;
  if (!user) {
    throw new API_ERROR("User not found", 404, {
      errorCode: "user_not_found",
      path: req.originalUrl,
      cause: "User not found in the request",
    });
  }
  user.refreshToken = null;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .clearCookie("accessToken", cookie_Options)
    .clearCookie("refreshToken", cookie_Options)
    .json(
      API_Response.success(
        { user },
        {
          statusCode: 200,
          message: "User logged out successfully",
          meta: {
            timestamp: new Date().toISOString(),
          },
        },
      ),
    );
});

const renewAccessToken = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) throw new API_ERROR(
    "No refresh token found",
    401,
    {
      errorCode: "no_refresh_token",
      path: req.originalUrl,
      cause: "No refresh token found in the request",
    });

  const validatedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

  if (!validatedRefreshToken) throw new API_ERROR
    (
      "Invalid or expired refresh token",
      401,
      {
        errorCode: "invalid_or_expired_refresh_token",
        path: req.originalUrl,
        cause: "Invalid or expired refresh token",
      }
    )

  const user = await User.findById(validatedRefreshToken?.id);

  if (!user) throw new API_ERROR(
    "User not found",
    404,
    {
      errorCode: "user_not_found",
      path: req.originalUrl,
      cause: "User not found in the database",
    }
  )

  if (refreshToken !== user?.refreshToken) {
    throw new API_ERROR(
      "Invalid refresh token",
      401,
      {
        errorCode: "invalid_refresh_token",
        path: req.originalUrl,
        cause: "Refresh token does not match the stored token",
      }
    );
  }


  const access_token = user.generateAccessToken()
  const refresh_token = user.generateRefreshToken()

  user.refreshToken = refresh_token

  await user.save({ validateBeforeSave: false })

  return res.status(200)
    .cookie("accessToken", access_token, cookie_Options)
    .cookie("refreshToken", refresh_token, cookie_Options)
    .json(
      API_Response.success(
        { user },
        {
          statusCode: 200,
          message: "Access token renewed successfully",
          meta: {
            timestamp: new Date().toISOString(),
          },
        },
      ),
    )

})

const currentUser = asyncHandler(async (req, res, next) => {
  const user = req?.user;

  if (!user) throw new API_ERROR(
    "User not found",
    404,
    {
      errorCode: "user_not_found",
      path: req.originalUrl,
      cause: "User not found in the request",
    }
  )

  return res.status(200).json(
    API_Response.success(
      { user },
      {
        statusCode: 200,
        message: "User fetched successfully",
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
    ),
  )

})

const updateUserInfo = asyncHandler(async (req, res, next) => {

  const { fullName, bio, socialMediaHandles } = req.body
  console.log(socialMediaHandles);


  if (!fullName && !bio && !socialMediaHandles) throw new API_ERROR(
    "At least one field is required",
    400,
    {
      errorCode: "at_least_one_field_required",
      path: req.originalUrl,
      cause: "At least one field is required to update user information",
    }
  )

  const user = req?.user;

  user.fullName = fullName || user.fullName;
  user.bio = bio || user.bio;
  user.socialMediaHandles = user.socialMediaHandles?.push(socialMediaHandles) || user.socialMediaHandles;

  await user.save({ validateBeforeSave: false })
  
  return res.status(200).json(
    API_Response.success(
      { user },
      {
        statusCode: 200,
        message: "User info updated successfully",
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
    ),
  )

})


const updateUserAvatar = asyncHandler(async (req, res, next) => {
  const user = req?.user;

  console.log("Have you updated");



  if (!req.file) throw new API_ERROR
    (
      "No avatar uploaded",
      400,
      {
        errorCode: "no_avatar_uploaded",
        path: req.originalUrl,
        cause: "No avatar uploaded in the request",
      }
    )

  const uploadAvatar = await cloudinaryFileUpload(req.file?.path)

  if (!uploadAvatar) throw new API_ERROR
    (
      "Failed to upload new avatar ",
      500,
      {
        errorCode: "failed_to_upload_avatar",
        path: req.originalUrl,
        cause: "Failed to upload new avatar to cloudinary",
      }
    )

  user.avatar = uploadAvatar?.secure_url

  await user.save({ validateBeforeSave: false })

  return res.status(200).json(
    API_Response.success(
      { user },
      {
        statusCode: 200,
        message: "User avatar updated successfully",
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
    ),
  )

})

const updateCoverImage = asyncHandler(async (req, res, next) => {
  const user = req?.user;

  if (!req.file) throw new API_ERROR
    (
      "No cover Image uploaded",
      400,
      {
        errorCode: "no_cover_image_uploaded",
        path: req.originalUrl,
        cause: "No cover Image uploaded in the request",
      }
    )

  const uploadAvatar = await cloudinaryFileUpload(req.file?.path)

  if (!uploadAvatar) throw new API_ERROR
    (
      "Failed to upload new cover image",
      500,
      {
        errorCode: "failed_to_upload_cover_image",
        path: req.originalUrl,
        cause: "Failed to upload new cover image to cloudinary",
      }
    )

  user.avatar = uploadAvatar?.secure_url

  await user.save({ validateBeforeSave: false })

  return res.status(200).json(
    API_Response.success(
      { user },
      {
        statusCode: 200,
        message: "User cover image updated successfully",
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
    ),
  )

})

const updateUserPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body

  console.log(currentPassword);
  console.log(newPassword);

  if (!currentPassword || !newPassword) throw new API_ERROR
    (
      "Current password and new password are required",
      400,
      {
        errorCode: "current_password_and_new_password_required",
        path: req.originalUrl,
        cause: "Current password and new password are required to update user password",
      }
    )

  const user = req?.user;

  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordCorrect) throw new API_ERROR
    (
      "Incorrect current password",
      401,
      {
        errorCode: "incorrect_current_password",
        path: req.originalUrl,
        cause: "Incorrect current password provided",
      }
    )

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    API_Response.success(
      {},
      {
        statusCode: 200,
        message: "User password updated successfully",
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
    ),
  )

})

const emailVerification = asyncHandler(async (req, res, next) => {

  const {token} = req?.query

  if(!token) throw new API_ERROR
  (
    "Token is required",
    400,
    {
      errorCode: "token_required",
      path: req.originalUrl,
      cause: "Token is required to verify user",
    }
  )

  const verifiedToken = jwt.verify(token , process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET)

  if(!verifiedToken) throw new API_ERROR
  (
    "Invalid token",
    401,
    {
      errorCode: "invalid_token",
      path: req.originalUrl,
      cause: "Invalid token provided for user verification",
    }
  )

  const user = await User.findByIdAndUpdate(
    verifiedToken.id,
    { $set:{
      isVerified:true
    } },
    { new: true },
  )

  if (!user) throw new API_ERROR
    (
      "User not found",
      404,
      {
        errorCode: "user_not_found",
        path: req.originalUrl,
        cause: "User not found in the database for verification",
      }
    )

    return res.status(200).json(
      API_Response.success(
        { user },
        {
          statusCode: 200,
          message: "User verified successfully",
          meta: {
            timestamp: new Date().toISOString(),
          },
        },
      ),
    )

})

export {
  registerUser,
  loginUser,
  logoutUser,
  renewAccessToken,
  updateUserInfo,
  updateUserAvatar,
  updateCoverImage,
  updateUserPassword,
  emailVerification,
  currentUser

};
