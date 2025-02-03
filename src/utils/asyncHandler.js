import { API_ERROR } from "./API_Error.js";
import path from "path";
import { fileURLToPath } from "url";

const asyncHandler = (func) => async (req, res, next) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  try {
    await func(req, res, next);
  } catch (error) {

    throw new API_ERROR(
      error.message || "Something went wrong in asyncHandler",
      error.statusCode || 500,
      {
        errorCode: "async_handler_error",
        path: `${__dirname}\/${path.basename(__filename)}`,
        stack: error.stack,
        cause: error.cause,
        validationErrors:error?.validationErrors,
        errors: error?.errors,
        data: null,
        
      }
    )
  }
};

export default asyncHandler;
