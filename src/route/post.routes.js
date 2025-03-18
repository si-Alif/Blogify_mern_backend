import { Router } from "express";
import {
  verifyJWT,
  upload
} from "../middleware/middleware.index.js"
import {
  postCreation
} from "../controller/post.controller.js"


const router = Router();

router.route("/create-post").post(
  verifyJWT,
  upload.array("featuredImages" , 10),
  postCreation

)

export default router;


