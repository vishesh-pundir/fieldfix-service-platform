require("dotenv").config();
const app = require("./app");
const { connectToDatabase } = require("./config/database");

const port = Number(process.env.PORT) || 5001;
const storageMode = process.env.STORAGE_MODE || "memory";

async function startServer() {
  if (storageMode === "mongo") {
    await connectToDatabase();
  } else {
    console.log("Running in memory demo mode. Records reset when the server restarts.");
  }

  app.listen(port, function () {
    console.log("FieldFix API listening at http://localhost:" + port);
  });
}

startServer().catch(function (error) {
  console.error("The API could not start:", error.message);
  process.exit(1);
});
