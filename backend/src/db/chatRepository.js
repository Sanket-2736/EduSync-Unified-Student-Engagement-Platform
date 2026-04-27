const ChatMessage = require("../models/ChatMessage");

/**
 * Save a chat message.
 * @param {string} userId - User ID
 * @param {string} role - Message role (user, assistant, system)
 * @param {string} content - Message content
 * @param {string} sessionId - Chat session ID
 * @returns {Promise<object>} - Saved message document
 */
async function saveChatMessage(userId, role, content, sessionId) {
  const message = new ChatMessage({
    userId,
    sessionId,
    role,
    content,
  });

  await message.save();
  return message.toObject();
}

/**
 * Get chat history for a user and session.
 * @param {string} userId - User ID
 * @param {string} sessionId - Chat session ID
 * @param {number} limit - Max messages to return (default 20)
 * @returns {Promise<array>} - Array of messages (oldest first)
 */
async function getChatHistory(userId, sessionId, limit = 20) {
  const messages = await ChatMessage.find({ userId, sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // Reverse to get oldest first
  return messages.reverse();
}

/**
 * Delete all messages in a chat session.
 * @param {string} userId - User ID
 * @param {string} sessionId - Chat session ID
 * @returns {Promise<object>} - DeleteResult
 */
async function deleteSessionHistory(userId, sessionId) {
  const result = await ChatMessage.deleteMany({ userId, sessionId });
  return result;
}

module.exports = {
  saveChatMessage,
  getChatHistory,
  deleteSessionHistory,
};
