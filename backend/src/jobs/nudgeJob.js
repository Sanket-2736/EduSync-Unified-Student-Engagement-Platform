const cron = require("node-cron");
const User = require("../models/User");
const Assessment = require("../models/Assessment");
const nudgeEngine = require("../services/nudgeEngine");

/**
 * For each inactive user (no login in 3+ days), generate and log a nudge.
 * In production this would send an email / push notification.
 */
async function runNudgeJob() {
  console.log("[NudgeJob] Starting daily nudge run…");

  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // Find users who haven't logged in for 3+ days (or never logged in)
    const inactiveUsers = await User.find({
      $or: [
        { lastLogin: { $lt: threeDaysAgo } },
        { lastLogin: null },
      ],
    }).lean();

    console.log(`[NudgeJob] Found ${inactiveUsers.length} inactive user(s)`);

    for (const user of inactiveUsers) {
      try {
        // Fetch recent activity for context
        const recentActivity = await Assessment.find({ userId: user._id })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        const nudge = await nudgeEngine.generateNudge(user, recentActivity);

        // ── Simulate email / push notification ──────────────────────────────
        console.log(
          `[NudgeJob] Nudge for ${user.name} <${user.email}>:\n` +
            `  Type   : ${nudge.type}\n` +
            `  Message: ${nudge.message}\n` +
            `  CTA    : ${nudge.cta} → ${nudge.ctaUrl}\n`
        );

        // TODO: replace with real email/push service, e.g.:
        // await emailService.send({ to: user.email, subject: nudge.cta, body: nudge.message });
        // await pushService.send({ userId: user._id, ...nudge });
      } catch (userErr) {
        console.error(
          `[NudgeJob] Failed to generate nudge for user ${user._id}:`,
          userErr.message
        );
      }
    }

    console.log("[NudgeJob] Daily nudge run complete.");
  } catch (err) {
    console.error("[NudgeJob] Fatal error:", err.message);
  }
}

/**
 * Register the cron job.
 * 0 3 * * *  →  3:00 AM UTC  =  9:00 AM IST
 */
function registerNudgeJob() {
  cron.schedule(
    "0 3 * * *",
    async () => {
      await runNudgeJob();
    },
    {
      timezone: "UTC",
    }
  );

  console.log("[NudgeJob] Scheduled: daily at 09:00 IST (03:00 UTC)");
}

module.exports = { registerNudgeJob, runNudgeJob };
