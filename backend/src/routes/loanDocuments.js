const express = require("express");
const router = express.Router();
const LoanApplication = require("../models/LoanApplication");

/**
 * POST /api/loan/applications
 * Create or update a loan application for the authenticated user.
 * Body: { loanAmount, university, course, country, selectedLender,
 *         eligibilityResult, repaymentPlan }
 */
router.post("/applications", async (req, res) => {
  const userId = req.user?.id;
  const {
    loanAmount,
    university,
    course,
    country,
    selectedLender,
    eligibilityResult,
    repaymentPlan,
  } = req.body;

  try {
    // Upsert: one draft application per user
    let application = await LoanApplication.findOne({
      userId,
      status: "draft",
    });

    if (application) {
      Object.assign(application, {
        loanAmount,
        university,
        course,
        country,
        selectedLender,
        eligibilityResult,
        repaymentPlan,
      });
    } else {
      application = new LoanApplication({
        userId,
        loanAmount,
        university,
        course,
        country,
        selectedLender,
        eligibilityResult,
        repaymentPlan,
        documents: [],
      });
    }

    await application.save();
    res.status(201).json({ success: true, data: application });
  } catch (err) {
    console.error("Create loan application error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/loan/applications/current
 * Get the current draft loan application for the authenticated user.
 */
router.get("/applications/current", async (req, res) => {
  const userId = req.user?.id;

  try {
    const application = await LoanApplication.findOne({
      userId,
      status: "draft",
    }).lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "No active loan application found",
      });
    }

    res.json({ success: true, data: application });
  } catch (err) {
    console.error("Get loan application error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/loan/applications/:applicationId/documents/:documentId
 * Update the status of a single document.
 * Body: { status: "pending"|"uploaded"|"verified" }
 */
router.patch(
  "/applications/:applicationId/documents/:documentId",
  async (req, res) => {
    const userId = req.user?.id;
    const { applicationId, documentId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "uploaded", "verified"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    try {
      const application = await LoanApplication.findOne({
        _id: applicationId,
        userId,
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          error: "Loan application not found",
        });
      }

      const doc = application.documents.id(documentId);
      if (!doc) {
        return res.status(404).json({
          success: false,
          error: "Document not found",
        });
      }

      doc.status = status;
      if (status === "uploaded" || status === "verified") {
        doc.uploadedAt = new Date();
      }

      await application.save();
      res.json({ success: true, data: application });
    } catch (err) {
      console.error("Update document status error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * POST /api/loan/applications/:applicationId/documents
 * Add a document entry to a loan application.
 * Body: { name: string }
 */
router.post("/applications/:applicationId/documents", async (req, res) => {
  const userId = req.user?.id;
  const { applicationId } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: "name is required" });
  }

  try {
    const application = await LoanApplication.findOne({
      _id: applicationId,
      userId,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Loan application not found",
      });
    }

    application.documents.push({ name, status: "pending" });
    await application.save();
    res.status(201).json({ success: true, data: application });
  } catch (err) {
    console.error("Add document error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/loan/applications/:applicationId/submit
 * Submit the loan application (changes status from draft → submitted).
 */
router.post("/applications/:applicationId/submit", async (req, res) => {
  const userId = req.user?.id;
  const { applicationId } = req.params;

  try {
    const application = await LoanApplication.findOne({
      _id: applicationId,
      userId,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Loan application not found",
      });
    }

    if (application.status !== "draft") {
      return res.status(400).json({
        success: false,
        error: `Application is already ${application.status}`,
      });
    }

    application.status = "submitted";
    await application.save();
    res.json({ success: true, data: application });
  } catch (err) {
    console.error("Submit application error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
