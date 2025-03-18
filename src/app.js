import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express()

console.log(process.env.CORS_ORIGIN);


app.use(cors({
  origin:process.env.CORS_ORIGIN,
  credentials: true,
}))

app.use(
  express.json({limit:"32kb"})
)

app.use(express.urlencoded({extended:true , limit:"32kb"}))

app.use(express.static("public"))

app.use(cookieParser())


import userRouter from "./route/user.routes.js"
import postRouter from "./route/post.routes.js"

app.use("/api/v1/user", userRouter)
app.use("/api/v1/post", postRouter)

export {
  app
}