import mongoose from "mongoose";
import { MongoDB_User_Database } from "../constants.js";
import { API_ERROR } from "../utils/API_Error.js";

const connectDB = async () => {
  try {
    const connect = await mongoose.connect(
      `${process.env.MONGO_DB_MAIN_CLUSTER_CONNECTION_URI}/${MongoDB_User_Database}`
    );

    console.log(`✅ Connected to ${MongoDB_User_Database} database`);

  } catch (error) {
    throw new API_ERROR(
      error.message || "Error while connecting to the database",
      error.code || 500,
      {
        errorCode: "mongodb_connection_error",
        path: "src/db/index.js",
        stack: error.stack,
      }
    );
  }
};

export {
  connectDB,
}