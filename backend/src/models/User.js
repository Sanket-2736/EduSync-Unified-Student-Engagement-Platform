const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },

    // ── Core identity ──────────────────────────────────────────────────────────
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // ── Auth ───────────────────────────────────────────────────────────────────
    passwordHash: { type: String, default: null },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },

    // ── Onboarding ─────────────────────────────────────────────────────────────
    onboardingComplete: { type: Boolean, default: false },

    // ── Legacy flat fields (kept for backward compat) ─────────────────────────
    phone: { type: String, trim: true },
    city: { type: String },

    // ── Structured profile ─────────────────────────────────────────────────────
    profile: {
      // Academics
      academics: {
        gre: Number,
        gpa: Number,
        bachelorsField: String,
        currentYear: String, // e.g. "Final Year", "Working Professional"
        // Legacy flat fields mirrored here for compatibility
        undergradDegree: String,
        greScore: Number,
        ieltsScore: Number,
        toeflScore: Number,
        workExperience: Number,
      },
      // Preferences
      preferences: {
        preferredCountries: [String],
        preferredCourses: [String],
        studyTimeline: String, // e.g. "Fall 2025"
        targetField: String,   // legacy alias
      },
      // Finances
      finances: {
        budgetUSD: Number,
        familyIncomeINR: Number,
        loanRequired: Boolean,
        // Legacy aliases
        educationBudget: Number,
        familyIncome: Number,
        hasCollateral: Boolean,
      },
      // Goals
      goals: {
        careerGoal: String,
        targetIndustry: String,
        priorityFactors: [String], // e.g. ["Scholarships", "Rankings", "ROI"]
        biggestConcerns: [String], // legacy alias
      },
    },

    // ── Gamification ───────────────────────────────────────────────────────────
    points: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastLoginDate: { type: Date, default: null },
    lastLogin: { type: Date, default: null }, // legacy alias
    badges: [{ type: String }],

    // ── Referral ───────────────────────────────────────────────────────────────
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String, default: null }, // referral code of referrer
  },
  {
    _id: false,       // we manage _id ourselves
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

// ── Pre-save: sync lastLogin alias ────────────────────────────────────────────
userSchema.pre("save", function (next) {
  // Keep lastLogin in sync with lastLoginDate for backward compat
  if (this.isModified("lastLoginDate")) {
    this.lastLogin = this.lastLoginDate;
  }
  next();
});

// ── toJSON: rename _id → id ───────────────────────────────────────────────────
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash; // never expose hash
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
