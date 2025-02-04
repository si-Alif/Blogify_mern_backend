import { Router } from "express";
import {
  upload,
  verifyJWT,
  getVerified
} from "../middleware/middleware.index.js"
import {

        registerUser,
        loginUser,
        logoutUser,
        renewAccessToken,
        emailVerification

      } from "../controller/user.controller.js";

const router = Router();

router.route("/register").post(

            upload.fields([
              {name:"avatar", maxCount:1},
              {name:"coverImage", maxCount:1}
            ]),

          registerUser

)
router.route("/login").post(upload.none() , loginUser)

router.route("/logout").post(verifyJWT , logoutUser)

router.route("/refresh-token").post(renewAccessToken)

router.route("/send-verification-email").post(verifyJWT , getVerified)

router.get("/verify-email", emailVerification);

export default router