const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  updateStreak,
  addBadge,
  addPoints,
} = require("../db/userRepository");

/**
 * POST /api/users/signup
 * Credentials-based signup with password hashing.
 * No auth required.
 */
router.post("/signup", async (req, res) => {
  const { name, email, password, referralCode } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: "name, email, and password are required",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 8 characters",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({
      name,
      email,
      passwordHash,
      provider: "credentials",
      referredBy: referralCode || null,
    });

    await addBadge(user.id, "First Step");

    res.status(201).json({
      success: true,
      data: { userId: user.id, user },
    });
  } catch (err) {
    if (err.message === "Email already registered") {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }
    console.error("Signup error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/users/signin
 * Credentials-based sign-in — validates email + password.
 * Returns the user object (session management handled by NextAuth on the frontend).
 * No auth required.
 */
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "email and password are required" });
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: "This account uses Google sign-in. Please continue with Google.",
      });
    }

    // Fetch raw doc to get passwordHash (toJSON strips it)
    const User = require("../models/User");
    const rawUser = await User.findById(user.id).lean();
    const valid = await bcrypt.compare(password, rawUser.passwordHash);

    if (!valid) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error("Signin error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/users/by-email/:email
 * Look up a user by email — used by the login page.
 * No auth required (the email IS the credential here).
 */
router.get("/by-email/:email", async (req, res) => {
  try {
    const user = await getUserByEmail(
      decodeURIComponent(req.params.email)
    );
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("Get user by email error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/users/create
 * Legacy create endpoint — kept for backward compatibility.
 * Delegates to signup logic without password.
 */
router.post("/create", async (req, res) => {
  const { name, email, phone, city, ...profileData } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, error: "name and email are required" });
  }

  try {
    const user = await createUser({
      name,
      email,
      phone,
      city,
      profile: profileData.profile || {},
    });

    await addBadge(user.id, "First Step");

    res.status(201).json({ success: true, data: { userId: user.id, user } });
  } catch (err) {
    if (err.message === "Email already registered") {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }
    console.error("User creation error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/users/oauth
 * Called by NextAuth after a successful Google OAuth sign-in.
 * Creates the user if they don't exist, returns the user object.
 * No auth required.
 */
router.post("/oauth", async (req, res) => {
  const { name, email, provider } = req.body;

  if (!name || !email || !provider) {
    return res.status(400).json({ success: false, error: "name, email, provider required" });
  }

  try {
    const { findOrCreateOAuthUser } = require("../db/userRepository");
    const { user, isNew } = await findOrCreateOAuthUser({ name, email, provider });

    if (isNew) {
      await addBadge(user.id, "First Step");
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error("OAuth user error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID (auth required).
 */
router.get("/:id", async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    if (err.message === "User not found") {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }
    console.error("Get user error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user profile (auth required).
 */
router.put("/:id", async (req, res) => {
  try {
    const { profile, ...topLevel } = req.body;

    // Build a flat $set object using dot-notation for nested profile fields.
    // This prevents wiping sibling nested fields (e.g. updating academics
    // won't erase preferences).
    const setPayload = { ...topLevel };

    if (profile) {
      for (const [section, fields] of Object.entries(profile)) {
        if (fields && typeof fields === "object") {
          for (const [key, value] of Object.entries(fields)) {
            setPayload[`profile.${section}.${key}`] = value;
          }
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: setPayload },
      { new: true, runValidators: false }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Award "Profile Complete" badge if all key sections are filled
    const p = user.profile || {};
    const isProfileComplete =
      p.academics?.undergradDegree &&
      p.academics?.gpa &&
      p.preferences?.targetField &&
      p.preferences?.preferredCountries?.length > 0 &&
      p.goals?.careerGoal;

    if (isProfileComplete) {
      await addBadge(req.params.id, "Profile Complete");
      await addPoints(req.params.id, 50);
    }

    // Re-fetch to get updated points/badges
    const fresh = await getUserById(req.params.id);

    res.json({ success: true, data: fresh });
  } catch (err) {
    if (err.message === "User not found") {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    console.error("Update user error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/users/:id/login
 * Update streak and points on login (auth required).
 */
router.post("/:id/login", async (req, res) => {
  try {
    const result = await updateStreak(req.params.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    if (err.message === "User not found") {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }
    console.error("Login error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
