import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";


dotenv.config({ path: "./.env" });

const port = process.env.PORT || 3000;

// const options = {
//   key: fs.readFileSync("./ssl/server.key"),
//   cert: fs.readFileSync("./ssl/server.cert"),
// };

try {
  connectDB()
    .then(() => {
      app.on("error", (err) => {
        console.error(`Error starting the server: ${err.message}`);
        process.exit(1);
      });

      // // Start HTTPS Server
      // https.createServer(options, app).listen(port, () => {
      //   console.log(`🚀 Server running securely on https://localhost:${port}`);
      // });
    app.listen(port, () => {
        console.log(`��� Server running on http://localhost:${port}`);
      });
    })
    .catch((err) => {
      console.error(`Error connecting to the database: ${err.message}`);
      process.exit(1);
    });

} catch (error) {
  throw new Error(`Error starting the server: ${error.message}`);
}