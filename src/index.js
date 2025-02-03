import dotenv from "dotenv"
import { connectDB } from "./db/index.js"
import { app } from "./app.js";

dotenv.config({
  path:"./.env"
});

const port = process.env.PORT || 3000

try {

  connectDB()
  .then(()=>{
    app.on('error',()=>{
      console.error(
        `Error starting the server./index.js: ${err.message}`
      )
      process.exit(1)
    })
    app.listen(port, () => {
      console.log(
        `Server running on port ${port}`
      )
    })
  })
  .catch(err =>{
    console.error(
      `Error connecting to the database ./index.js: ${err.message}`
    )
    process.exit(1)
  }
  )


} catch (error) {
  throw new Error(
   `Error starting the server./index.js: ${error.message}`
  )
}

