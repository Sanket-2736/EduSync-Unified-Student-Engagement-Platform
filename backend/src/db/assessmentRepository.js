const Assessment = require("../models/Assessment");

/**
 * Save an assessment result.
 * @param {string} userId - User ID
 * @param {string} type - Assessment type (career, roi, admission, loan)
 * @param {object} input - Raw form inputs
 * @param {object} result - AI response JSON
 * @returns {Promise<object>} - Saved assessment document
 */
async function saveAssessment(userId, type, input, result) {
  const assessment = new Assessment({
    userId,
    type,
    input,
    result,
  });

  await assessment.save();
  return assessment.toObject();
}

/**
 * Get all assessments for a user, optionally filtered by type.
 * @param {string} userId
 * @param {string|null} type
 * @returns {Promise<array>}
 */
async function getAssessmentsByUser(userId, type = null) {
  const query = { userId };
  if (type) query.type = type;
  return Assessment.find(query).sort({ createdAt: -1 }).lean();
}

/**
 * Get a single assessment by ID, scoped to a user.
 * @param {string} userId
 * @param {string} assessmentId
 * @returns {Promise<object|null>}
 */
async function getAssessmentById(userId, assessmentId) {
  return Assessment.findOne({ _id: assessmentId, userId }).lean();
}

module.exports = {
  saveAssessment,
  getAssessmentsByUser,
  getAssessmentById,
};
