require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { connectDB } = require("./db");
const authMiddleware = require("./middleware/auth");
const { registerNudgeJob } = require("./jobs/nudgeJob");

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." },
});
app.use(limiter);

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount all API routers under /api
app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));

// Apply auth middleware globally AFTER /api/users so /api/users/create is not blocked
app.use(authMiddleware);

app.use("/api/career-navigator", require("./routes/careerNavigator"));
app.use("/api/roi-calculator", require("./routes/roiCalculator"));
app.use("/api/admission-predictor", require("./routes/admissionPredictor"));
app.use("/api/mentor", require("./routes/mentor"));
app.use("/api/loan", require("./routes/loanAdvisor"));
app.use("/api/loan", require("./routes/loanDocuments"));
app.use("/api/assessments", require("./routes/assessments"));
app.use("/api/scores", require("./routes/scores"));
app.use("/api/test-prep", require("./routes/testPrep"));
app.use("/api/content", require("./routes/contentGenerator"));

// Legacy routes (kept for backward compatibility)
app.use("/api/health", require("./routes/health"));
app.use("/api/ai", require("./routes/ai"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// Start server with MongoDB connection
async function startServer() {
  try {
    await connectDB();
    registerNudgeJob();
    app.listen(PORT, () => {
      console.log(`StudyAI backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
