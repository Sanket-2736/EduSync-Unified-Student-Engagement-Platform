const User = require("../models/User");
const crypto = require("crypto");

/**
 * Generate a unique 8-character alphanumeric referral code.
 */
async function generateUniqueReferralCode() {
  let code;
  let exists = true;
  while (exists) {
    code = crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 chars
    exists = !!(await User.findOne({ referralCode: code }).lean());
  }
  return code;
}

/**
 * Create a new user with profile data.
 * @param {object} profileData
 * @returns {Promise<object>}
 */
async function createUser(profileData) {
  const { email } = profileData;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const referralCode = await generateUniqueReferralCode();
  const user = new User({ ...profileData, referralCode });
  await user.save();
  return user.toJSON();
}

/**
 * Find or create a user from an OAuth provider (e.g. Google).
 * @param {{ name, email, provider, image? }} oauthData
 * @returns {Promise<{ user: object, isNew: boolean }>}
 */
async function findOrCreateOAuthUser({ name, email, provider }) {
  let user = await User.findOne({ email: email.toLowerCase() });
  let isNew = false;

  if (!user) {
    const referralCode = await generateUniqueReferralCode();
    user = new User({
      name,
      email: email.toLowerCase(),
      provider,
      referralCode,
      onboardingComplete: false,
    });
    await user.save();
    isNew = true;
  } else if (user.provider !== provider) {
    // Account exists with different provider — update provider
    user.provider = provider;
    await user.save();
  }

  return { user: user.toJSON(), isNew };
}

/**
 * Get user by ID.
 * @param {string} id - User ID
 * @returns {Promise<object>} - User document
 */
async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) {
    throw new Error("User not found");
  }
  return user.toJSON();
}

/**
 * Get user by email.
 * @param {string} email - User email
 * @returns {Promise<object|null>} - User document or null
 */
async function getUserByEmail(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  return user ? user.toJSON() : null;
}

/**
 * Update user by ID.
 * @param {string} id - User ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} - Updated user document
 */
async function updateUser(id, updates) {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { ...updates, updatedAt: new Date() } },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new Error("User not found");
  }

  return user.toJSON();
}

/**
 * Update user streak and points on login.
 * Works with both lastLogin and lastLoginDate fields.
 */
async function updateStreak(id) {
  const user = await User.findById(id);
  if (!user) throw new Error("User not found");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Support both field names
  const lastSeen = user.lastLoginDate || user.lastLogin;
  let pointsEarned = 0;

  if (lastSeen) {
    const last = new Date(lastSeen);
    last.setUTCHours(0, 0, 0, 0);
    if (last.getTime() === today.getTime()) {
      return { streak: user.streak, points: user.points, pointsEarned: 0 };
    } else if (last.getTime() === yesterday.getTime()) {
      user.streak += 1;
    } else {
      user.streak = 1;
    }
  } else {
    user.streak = 1;
  }

  const now = new Date();
  user.lastLoginDate = now;
  user.lastLogin = now;
  user.points += 10;
  pointsEarned = 10;

  await user.save();
  return { streak: user.streak, points: user.points, pointsEarned };
}

/**
 * Add a badge to user (no duplicates).
 * @param {string} id - User ID
 * @param {string} badge - Badge name
 * @returns {Promise<object>} - Updated user document
 */
async function addBadge(id, badge) {
  const user = await User.findByIdAndUpdate(
    id,
    { $addToSet: { badges: badge } },
    { new: true }
  );

  if (!user) {
    throw new Error("User not found");
  }

  return user.toJSON();
}

/**
 * Add points to user.
 * @param {string} id - User ID
 * @param {number} points - Points to add
 * @returns {Promise<object>} - Updated user document
 */
async function addPoints(id, points) {
  const user = await User.findByIdAndUpdate(
    id,
    { $inc: { points } },
    { new: true }
  );

  if (!user) {
    throw new Error("User not found");
  }

  return user.toJSON();
}

module.exports = {
  createUser,
  findOrCreateOAuthUser,
  getUserById,
  getUserByEmail,
  updateUser,
  updateStreak,
  addBadge,
  addPoints,
};
