const mongoose = require("mongoose");

// Mongo mode is only ready after Mongoose confirms the connection.
async function connectToDatabase() {
  const connectionString = process.env.MONGODB_URI;

  if (!connectionString) {
    throw new Error("MONGODB_URI is required when STORAGE_MODE=mongo.");
  }

  await mongoose.connect(connectionString);
  console.log("Connected to MongoDB.");
}

module.exports = { connectToDatabase };
