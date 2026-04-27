const express = require("express");
const router = express.Router();
const { cerebrasService } = require("../services");
const { addPoints, addBadge } = require("../db/userRepository");

/**
 * POST /api/content/sop
 * Generate a personalized Statement of Purpose.
 */
router.post("/sop", async (req, res) => {
  const {
    name, university, program, gpa, greScore, workExp,
    researchInterests, careerGoal, achievements, whyThisUniversity,
    targetField, preferredCountry,
  } = req.body;

  if (!university || !program) {
    return res.status(400).json({ success: false, error: "university and program are required" });
  }

  const systemPrompt = `You are an expert SOP writer who has helped hundreds of Indian students get admitted to top universities worldwide.
You write compelling, authentic, and personalized Statements of Purpose that stand out to admissions committees.`;

  const userPrompt = `Write a complete, personalized Statement of Purpose for an Indian student:

Student Name: ${name || "the applicant"}
Target University: ${university}
Program: ${program}
GPA/CGPA: ${gpa || "Not provided"}
GRE Score: ${greScore || "Not provided"}
Work Experience: ${workExp ? `${workExp} years` : "Fresher"}
Research Interests: ${researchInterests || "Not specified"}
Career Goal: ${careerGoal || "Not specified"}
Key Achievements: ${achievements || "Not specified"}
Why This University: ${whyThisUniversity || "Not specified"}
Field: ${targetField || program}
Country: ${preferredCountry || "Not specified"}

Return a JSON object with exactly this structure:
{
  "sop": string,
  "wordCount": number,
  "highlights": [string],
  "improvementSuggestions": [string],
  "keyThemes": [string],
  "openingHook": string,
  "alternativeOpenings": [string]
}

sop should be a complete, 800-1000 word SOP with proper paragraphs.
highlights are 3-4 strongest points in the SOP.
improvementSuggestions are 3 ways to further personalize it.
keyThemes are the main narrative threads.
openingHook is the first sentence.
alternativeOpenings provides 2 alternative first sentences.`;

  try {
    const data = await cerebrasService.chatJSON(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 2048, temperature: 0.7 }
    );

    if (req.user?.id) {
      Promise.all([
        addPoints(req.user.id, 30),
        addBadge(req.user.id, "Content Creator"),
      ]).catch(() => {});
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("content/sop error:", err.message);
    const userMessage = err.message.includes("timed out")
      ? "The AI took too long to respond. Please try again."
      : "Failed to generate SOP. Please try again.";
    res.status(502).json({ success: false, error: userMessage });
  }
});

/**
 * POST /api/content/cover-letter
 * Generate a cover letter for internship or job applications.
 */
router.post("/cover-letter", async (req, res) => {
  const {
    name, company, role, roleType, skills, experience,
    careerGoal, achievements, targetField, university,
  } = req.body;

  if (!company || !role) {
    return res.status(400).json({ success: false, error: "company and role are required" });
  }

  const systemPrompt = `You are a professional career coach who writes compelling cover letters for international students seeking internships and jobs abroad.`;

  const userPrompt = `Write a professional cover letter for an Indian student:

Applicant Name: ${name || "the applicant"}
Company: ${company}
Role: ${role}
Role Type: ${roleType || "Full-time"}
Key Skills: ${skills || "Not specified"}
Experience: ${experience || "Fresher / Student"}
Career Goal: ${careerGoal || "Not specified"}
Key Achievements: ${achievements || "Not specified"}
Field: ${targetField || "Not specified"}
University: ${university || "Not specified"}

Return a JSON object with exactly this structure:
{
  "coverLetter": string,
  "wordCount": number,
  "keySellingPoints": [string],
  "toneAnalysis": string,
  "customizationTips": [string],
  "subjectLine": string,
  "followUpTemplate": string
}

coverLetter should be 300-400 words, professional, and tailored to the role.
keySellingPoints are 3-4 strongest arguments for hiring this candidate.
toneAnalysis describes the tone (e.g., "Confident and professional").
customizationTips are 3 ways to further tailor it for this specific company.
subjectLine is a compelling email subject line.
followUpTemplate is a short 2-sentence follow-up email template.`;

  try {
    const data = await cerebrasService.chatJSON(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 1536, temperature: 0.7 }
    );

    if (req.user?.id) {
      addPoints(req.user.id, 20).catch(() => {});
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("content/cover-letter error:", err.message);
    res.status(502).json({ success: false, error: "Failed to generate cover letter. Please try again." });
  }
});

/**
 * POST /api/content/email
 * Generate professional email templates for professors or admissions offices.
 */
router.post("/email", async (req, res) => {
  const {
    emailType, recipientName, recipientTitle, university,
    program, senderName, researchInterest, specificQuestion,
    targetField,
  } = req.body;

  if (!emailType || !university) {
    return res.status(400).json({ success: false, error: "emailType and university are required" });
  }

  const emailTypeDescriptions = {
    professor_research: "Cold email to a professor about research opportunities",
    professor_phd: "Email to a professor expressing interest in PhD supervision",
    admissions_inquiry: "Inquiry email to admissions office about the program",
    admissions_status: "Follow-up email to check application status",
    scholarship_inquiry: "Email inquiring about scholarship opportunities",
    deferral_request: "Email requesting admission deferral",
    waitlist_appeal: "Email appealing waitlist decision",
  };

  const systemPrompt = `You are an expert in professional academic communication who helps Indian students write effective emails to professors and university admissions offices.`;

  const userPrompt = `Write a professional email for an Indian student:

Email Type: ${emailTypeDescriptions[emailType] || emailType}
Recipient Name: ${recipientName || "Professor/Admissions Team"}
Recipient Title: ${recipientTitle || "Professor"}
University: ${university}
Program: ${program || "Not specified"}
Sender Name: ${senderName || "the student"}
Research Interest: ${researchInterest || "Not specified"}
Specific Question/Purpose: ${specificQuestion || "Not specified"}
Field: ${targetField || "Not specified"}

Return a JSON object with exactly this structure:
{
  "subject": string,
  "emailBody": string,
  "wordCount": number,
  "toneNotes": string,
  "doList": [string],
  "dontList": [string],
  "followUpTiming": string,
  "alternativeSubjects": [string]
}

emailBody should be 150-250 words, professional, and specific.
doList has 3-4 best practices for this type of email.
dontList has 3 common mistakes to avoid.
followUpTiming advises when to send a follow-up if no reply.
alternativeSubjects provides 2 alternative subject lines.`;

  try {
    const data = await cerebrasService.chatJSON(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 1536, temperature: 0.6 }
    );

    if (req.user?.id) {
      addPoints(req.user.id, 15).catch(() => {});
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("content/email error:", err.message);
    res.status(502).json({ success: false, error: "Failed to generate email. Please try again." });
  }
});

/**
 * POST /api/content/social
 * Generate LinkedIn / social media content for professional presence.
 */
router.post("/social", async (req, res) => {
  const {
    platform, contentType, name, university, program,
    achievement, targetField, careerGoal, tone,
  } = req.body;

  if (!platform || !contentType) {
    return res.status(400).json({ success: false, error: "platform and contentType are required" });
  }

  const systemPrompt = `You are a social media strategist who helps Indian students build a strong professional presence online while studying or applying abroad.`;

  const userPrompt = `Create professional social media content for an Indian student:

Platform: ${platform}
Content Type: ${contentType}
Name: ${name || "the student"}
University: ${university || "Not specified"}
Program: ${program || "Not specified"}
Achievement/Topic: ${achievement || "Not specified"}
Field: ${targetField || "Not specified"}
Career Goal: ${careerGoal || "Not specified"}
Tone: ${tone || "Professional and authentic"}

Return a JSON object with exactly this structure:
{
  "mainPost": string,
  "hashtags": [string],
  "alternativeVersions": [string],
  "engagementTips": [string],
  "bestPostingTime": string,
  "callToAction": string,
  "characterCount": number
}

mainPost should be platform-appropriate (LinkedIn: 150-300 words, Twitter/X: under 280 chars).
hashtags should be 5-8 relevant, trending hashtags.
alternativeVersions provides 2 shorter/longer variations.
engagementTips are 3 tips to maximize reach and engagement.
bestPostingTime advises the optimal time to post.
callToAction is a compelling ending question or CTA.`;

  try {
    const data = await cerebrasService.chatJSON(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 1536, temperature: 0.8 }
    );

    if (req.user?.id) {
      addPoints(req.user.id, 10).catch(() => {});
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("content/social error:", err.message);
    res.status(502).json({ success: false, error: "Failed to generate social content. Please try again." });
  }
});

module.exports = router;
