const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    type: {
      type: String,
      enum: ["career", "roi", "admission", "loan"],
      required: true,
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

const Assessment = mongoose.model("Assessment", assessmentSchema);

module.exports = Assessment;
