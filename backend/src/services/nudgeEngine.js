const { cerebrasService } = require("./index");

class NudgeEngine {
  /**
   * Determine the user's application journey stage based on profile completeness
   * and activity history.
   * @param {object} userProfile
   * @param {Array}  activityHistory
   * @returns {"early"|"mid"|"late"}
   */
  _getStage(userProfile, activityHistory) {
    const profile = userProfile?.profile || {};
    const hasGRE = !!profile.greScore;
    const hasField = !!profile.targetField;
    const hasCountries = profile.preferredCountries?.length > 0;
    const hasBudget = !!profile.educationBudget;
    const activityCount = activityHistory?.length || 0;

    const completeness = [hasGRE, hasField, hasCountries, hasBudget].filter(
      Boolean
    ).length;

    if (completeness <= 1 || activityCount === 0) return "early";
    if (completeness <= 3 || activityCount < 5) return "mid";
    return "late";
  }

  /**
   * Generate a personalised nudge for a user.
   * @param {object} userProfile   - User document from DB
   * @param {Array}  activityHistory - Recent assessments / chat sessions
   * @returns {Promise<{ message: string, type: string, cta: string, ctaUrl: string }>}
   */
  async generateNudge(userProfile, activityHistory = []) {
    const stage = this._getStage(userProfile, activityHistory);
    const name = userProfile?.name?.split(" ")[0] || "there";
    const field = userProfile?.profile?.targetField || "your chosen field";
    const streak = userProfile?.streak || 0;
    const daysSinceLogin = userProfile?.lastLogin
      ? Math.floor(
          (Date.now() - new Date(userProfile.lastLogin).getTime()) /
            86_400_000
        )
      : 99;

    const systemPrompt = `You are a motivational AI coach for Indian students planning to study abroad. 
Generate a short, warm, personalised nudge message. Be concise (max 2 sentences). 
Use the student's name and context. Return ONLY valid JSON.`;

    const userPrompt = `Generate a nudge for this student:
- Name: ${name}
- Field: ${field}
- Application stage: ${stage}
- Current streak: ${streak} days
- Days since last login: ${daysSinceLogin}
- Recent activities: ${activityHistory.slice(0, 3).map((a) => a.type).join(", ") || "none"}

Return JSON with exactly this shape:
{
  "message": "string (personalised nudge, max 2 sentences)",
  "type": "reminder" | "encouragement" | "tip" | "alert",
  "cta": "string (short action label, e.g. 'Check your ROI')",
  "ctaUrl": "string (one of: /tools/career-navigator, /tools/roi-calculator, /tools/admission-predictor, /loan, /chat)"
}`;

    try {
      const result = await cerebrasService.chatJSON(
        [{ role: "user", content: userPrompt }],
        systemPrompt,
        { maxTokens: 256, temperature: 0.8 }
      );
      return result;
    } catch (err) {
      // Fallback nudge if AI call fails
      const fallbacks = {
        early: {
          message: `Hi ${name}! Your study-abroad journey starts with a single step. Complete your profile to get personalised recommendations.`,
          type: "reminder",
          cta: "Complete Profile",
          ctaUrl: "/onboard",
        },
        mid: {
          message: `${name}, you're making great progress! Run the Career Navigator to discover universities that match your profile.`,
          type: "encouragement",
          cta: "Find Universities",
          ctaUrl: "/tools/career-navigator",
        },
        late: {
          message: `${name}, application deadlines are approaching! Check your admission chances and finalise your shortlist today.`,
          type: "alert",
          cta: "Predict Admission",
          ctaUrl: "/tools/admission-predictor",
        },
      };
      return fallbacks[stage];
    }
  }

  /**
   * Get personalised content recommendations for a student.
   * @param {string} field         - e.g. "Computer Science"
   * @param {string} targetCountry - e.g. "USA"
   * @returns {Promise<{ blogTitle, blogSummary, scholarshipAlert, deadlineAlert }>}
   */
  async getPersonalizedContent(field, targetCountry) {
    const systemPrompt = `You are a study-abroad content curator for Indian students. 
Return ONLY valid JSON with no markdown.`;

    const userPrompt = `Generate personalised content for an Indian student interested in:
- Field: ${field}
- Target country: ${targetCountry}

Return JSON with exactly this shape:
{
  "blogTitle": "string (engaging article title relevant to their field and country)",
  "blogSummary": "string (2-sentence summary of the article)",
  "scholarshipAlert": "string (one real or realistic scholarship opportunity for this field/country)",
  "deadlineAlert": "string (upcoming application deadline reminder, e.g. 'Fall 2025 applications close in 3 months')"
}`;

    try {
      return await cerebrasService.chatJSON(
        [{ role: "user", content: userPrompt }],
        systemPrompt,
        { maxTokens: 512, temperature: 0.7 }
      );
    } catch (err) {
      return {
        blogTitle: `Top ${field} Programs in ${targetCountry} for Indian Students`,
        blogSummary: `Discover the best universities offering ${field} in ${targetCountry}. Learn about admission requirements, scholarships, and career prospects.`,
        scholarshipAlert: `Check the ${targetCountry} government scholarship portal for merit-based awards for international students.`,
        deadlineAlert: `Most Fall 2025 programs in ${targetCountry} have deadlines between December 2024 and February 2025.`,
      };
    }
  }
}

module.exports = new NudgeEngine();
