const mongoose = require("mongoose");

const loanApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "approved", "rejected"],
      default: "draft",
    },
    loanAmount: Number,
    university: String,
    course: String,
    country: String,
    selectedLender: String,
    eligibilityResult: {
      type: mongoose.Schema.Types.Mixed,
    },
    repaymentPlan: {
      type: mongoose.Schema.Types.Mixed,
    },
    documents: [
      {
        name: String,
        status: {
          type: String,
          enum: ["pending", "uploaded", "verified"],
          default: "pending",
        },
        uploadedAt: Date,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Pre-save hook to update updatedAt
loanApplicationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const LoanApplication = mongoose.model("LoanApplication", loanApplicationSchema);

module.exports = LoanApplication;
