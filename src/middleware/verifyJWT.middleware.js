import jwt from "jsonwebtoken"
import { API_ERROR, asyncHandler } from "../utils/index.js"
import { User } from "../model/user.model.js"

const verifyJWT = asyncHandler(async(req, res ,next)=>{
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "")

  if(!token){
    throw new API_ERROR
    (
      "You are not authenticated. Please log in",
      401,
      {
        errorCode: "not_authenticated",
        path: req.originalUrl,
        cause: "Invalid access token provided"
      }
    )
  }


  try{
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(payload?.id)

    if(!user) throw new API_ERROR(
      "User not found",
      404,
      {
        errorCode: "user_not_found",
        path: req.originalUrl,
        cause: "User not found in the database with the provided access token"
      }
    )

    req.user = user;

    next()
  }catch(error){
    throw new API_ERROR
    (
      "Invalid access token. Please log in again",
      403,
      {
        errorCode: "invalid_token",
        path: req.originalUrl,
        cause: "Invalid access token provided"
      }
    )
  }

})

export default verifyJWT