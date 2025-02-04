import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { asyncHandler } from "../utils/index.js";
import { API_ERROR, API_Response } from "../utils/index.js";

const getVerified = asyncHandler(async (req, res, next) => {
  const user = req?.user;

  if (!user) {
    throw new API_ERROR("User not found", 404, {
      errorCode: "user_not_found",
      path: req.originalUrl,
      cause: "User must be logged in to request verification",
    });
  }

  const token = jwt.sign(
    {
      id: user?.id,
      username: user?.username,
      email: user?.email,
    },
    process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET,
    { expiresIn: "5m" }
  );

  // Using API Key Authentication (Recommended by SendGrid)
  const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY, // Use the API key directly
    },
  });

  const verificationLink = `http://localhost:8000/api/v1/user/verify-email?token=${token}`;

  const mailOptions = {
    from: "shahrierislam9153@gmail.com", // Ensure this is a verified sender in SendGrid
    to: user?.email,
    subject: "Account Verification",
    html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
  };

  try {
    console.log("Sending email...");
    const success = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", success);

    return res.status(200).json(
      API_Response.success(
        {
          message: "Verification email has been sent to your registered email.",
          data: success,
        },
        "verification_email_sent",
        {
          statusCode: 200,
          location: "/api/v1/user/verify-email",
          meta: {
            timestamp: new Date().toISOString(),
          },
        }
      )
    );
  } catch (error) {
    console.error("Error sending email:", error);
    throw new API_ERROR("Failed to send verification email", 500, {
      errorCode: "failed_to_send_verification_email",
      path: req.originalUrl,
      cause: error.message,
    });
  }
});

export default getVerified;
