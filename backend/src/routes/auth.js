const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  createUser,
  getUserByEmail,
  updateStreak,
  addBadge,
} = require("../db/userRepository");

const JWT_SECRET = process.env.JWT_SECRET || "changeme_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Sign a JWT for a given user document.
 * @param {{ id: string, email: string }} user
 * @returns {string}
 */
function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
/**
 * Register a new user with email + password.
 * Body: { name, email, password, phone?, city?, referralCode? }
 * Returns: { success, data: { token, userId, user } }
 */
router.post("/register", async (req, res) => {
  const { name, email, password, phone, city, referralCode } = req.body;

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
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await createUser({
      name,
      email,
      passwordHash,
      provider: "credentials",
      phone: phone || undefined,
      city: city || undefined,
      referredBy: referralCode || null,
    });

    // Award first badge
    await addBadge(user.id, "First Step");

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      data: { token, userId: user.id, user },
    });
  } catch (err) {
    if (err.message === "Email already registered") {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }
    console.error("Register error:", err.message);
    return res.status(500).json({ success: false, error: "Registration failed" });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
/**
 * Sign in with email + password.
 * Body: { email, password }
 * Returns: { success, data: { token, userId, user, streak, points } }
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "email and password are required",
    });
  }

  try {
    // getUserByEmail returns toJSON() which strips passwordHash — fetch raw doc
    const User = require("../models/User");
    const rawUser = await User.findOne({ email: email.toLowerCase() }).lean();

    if (!rawUser) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    if (!rawUser.passwordHash) {
      return res.status(401).json({
        success: false,
        error: "This account uses Google sign-in. Please continue with Google.",
      });
    }

    const valid = await bcrypt.compare(password, rawUser.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    // Update streak and points
    const streakData = await updateStreak(rawUser._id);

    // Return safe user object (no passwordHash)
    const user = await getUserByEmail(email);
    const token = signToken(user);

    return res.json({
      success: true,
      data: {
        token,
        userId: user.id,
        user,
        streak: streakData.streak,
        points: streakData.points,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ success: false, error: "Login failed" });
  }
});

// ── POST /api/auth/verify ─────────────────────────────────────────────────────
/**
 * Verify a JWT token from the Authorization header.
 * Header: Authorization: Bearer <token>
 * Returns: { success, data: { userId, email } }
 */
router.post("/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({
      success: true,
      data: { userId: decoded.userId, email: decoded.email },
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
    });
  }
});

module.exports = router;
