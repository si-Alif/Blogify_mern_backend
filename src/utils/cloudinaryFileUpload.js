import { v2 as cloudinary } from "cloudinary";
import { API_ERROR } from "../utils/API_Error.js";
import fs from "fs"


cloudinary.config({
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
});

const cloudinaryFileUpload = async (localPath) => {

  if (!localPath) throw new API_ERROR
                                    ("Invalid file path", 400, {
                                    errorCode: "invalid_file_path",
                                    path: "cloudinaryFileUpload",
                                    cause: "No file path provided"
                                    });


  try {
    const uploadResult = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localPath)

    return uploadResult;
  } catch (error) {

    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath)
      } catch (error) {
        throw new Error(
          `Error unlinking temporary file: ${localPath}. Error: ${error.message} in cloudinary.js`
        )
      }
    }

    throw new API_ERROR(
      error?.message || "Error while uploading to Cloudinary",
      error?.http_code || 500,
      {
        errorCode: "cloudinary_upload_error",
        path: "./utils/cloudinary.js",
        data: { localPath },
        errors: error?.error || [],
        cause: `Cloudinary upload failed: ${error?.message}`,
        stack: error?.stack,

      }
    );
  }
};

export default cloudinaryFileUpload;
