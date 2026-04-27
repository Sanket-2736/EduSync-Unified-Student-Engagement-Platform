const jwt = require("jsonwebtoken");
const { getUserById } = require("../db/userRepository");

const JWT_SECRET = process.env.JWT_SECRET || "changeme_in_production";

/**
 * Routes that bypass authentication entirely.
 * Matched against req.path (relative to the mount point).
 */
const PUBLIC_PATHS = [
  { method: "POST", path: "/api/auth/register" },
  { method: "POST", path: "/api/auth/login" },
  { method: "POST", path: "/api/auth/verify" },
  { method: "POST", path: "/api/users/create" },
  { method: "POST", path: "/api/users/signup" },
  { method: "POST", path: "/api/users/signin" },
  { method: "POST", path: "/api/users/oauth" },
  { method: "GET",  path: "/health" },
  { method: "GET",  path: "/api/health" },
];

function isPublic(req) {
  return PUBLIC_PATHS.some(
    (p) =>
      p.method === req.method &&
      (req.path === p.path || req.originalUrl.split("?")[0] === p.path)
  );
}

/**
 * JWT-based authentication middleware.
 *
 * Reads the Authorization header:  Authorization: Bearer <token>
 * Falls back to x-user-id header for backward compatibility with
 * existing clients that haven't migrated to JWT yet.
 *
 * On success: attaches req.user and req.userId to the request.
 */
async function authMiddleware(req, res, next) {
  if (isPublic(req)) return next();

  // ── 1. Try JWT from Authorization header ─────────────────────────────────
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await getUserById(decoded.userId);
      req.user = user;
      req.userId = user.id;
      return next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, error: "Token expired. Please log in again." });
      }
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
  }

  // ── 2. Fallback: x-user-id header (legacy) ────────────────────────────────
  const userId = req.headers["x-user-id"];
  if (userId) {
    try {
      const user = await getUserById(userId);
      req.user = user;
      req.userId = user.id;
      return next();
    } catch (err) {
      if (err.message === "User not found") {
        return res.status(401).json({ success: false, error: "Invalid user ID" });
      }
      return res.status(500).json({ success: false, error: "Auth error" });
    }
  }

  // ── 3. No credentials at all ──────────────────────────────────────────────
  return res.status(401).json({ success: false, error: "Authentication required" });
}

module.exports = authMiddleware;
