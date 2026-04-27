const mongoose = require("mongoose");

/**
 * Connect to MongoDB using the URI from environment variables.
 * @returns {Promise<void>}
 */
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/studyai";

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const host = mongoose.connection.host;
    console.log(`MongoDB connected: ${host}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = {
  connectDB,
  mongoose,
};
