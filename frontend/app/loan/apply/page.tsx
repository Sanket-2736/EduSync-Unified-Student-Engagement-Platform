"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Upload,
  CheckCircle,
  Clock,
  ShieldCheck,
  Info,
  FileText,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  getCurrentLoanApplication,
  createLoanApplication,
  updateDocumentStatus,
  submitLoanApplication,
} from "@/lib/api";
import api from "@/lib/api";

// ── Document definitions ─────────────────────────────────────────────────────
interface DocumentItem {
  id: string;
  name: string;
  why: string;
  category: "identity" | "academic" | "financial" | "admission";
}

const DOCUMENTS: DocumentItem[] = [
  {
    id: "passport",
    name: "Valid Passport",
    why: "Required for identity verification and visa processing by the lender.",
    category: "identity",
  },
  {
    id: "aadhar",
    name: "Aadhaar Card",
    why: "Mandatory KYC document for all Indian financial institutions.",
    category: "identity",
  },
  {
    id: "pan",
    name: "PAN Card",
    why: "Required for tax compliance and credit history verification.",
    category: "identity",
  },
  {
    id: "marksheets",
    name: "10th & 12th Marksheets",
    why: "Demonstrates academic eligibility for the program applied to.",
    category: "academic",
  },
  {
    id: "degree",
    name: "Undergraduate Degree Certificate",
    why: "Confirms completion of prerequisite qualification for the course.",
    category: "academic",
  },
  {
    id: "transcripts",
    name: "Official Academic Transcripts",
    why: "Detailed grade records required by lenders to assess academic profile.",
    category: "academic",
  },
  {
    id: "gre_score",
    name: "GRE / GMAT Score Report",
    why: "Standardized test scores help lenders assess your academic potential.",
    category: "academic",
  },
  {
    id: "admission_letter",
    name: "University Admission Letter (I-20 / CAS)",
    why: "Confirms you have a valid offer from an accredited institution abroad.",
    category: "admission",
  },
  {
    id: "fee_structure",
    name: "University Fee Structure",
    why: "Lenders need the official fee breakdown to determine the loan amount.",
    category: "admission",
  },
  {
    id: "income_proof",
    name: "Co-Applicant Income Proof (Salary Slips / ITR)",
    why: "Demonstrates repayment capacity of the co-borrower.",
    category: "financial",
  },
  {
    id: "bank_statements",
    name: "Bank Statements (6 months)",
    why: "Shows financial stability and existing savings of the family.",
    category: "financial",
  },
  {
    id: "collateral",
    name: "Collateral Documents (if applicable)",
    why: "Property or asset documents required for secured loans above ₹40L.",
    category: "financial",
  },
];

const categoryLabels: Record<string, string> = {
  identity: "Identity Documents",
  academic: "Academic Documents",
  admission: "Admission Documents",
  financial: "Financial Documents",
};

const categoryColors: Record<string, string> = {
  identity: "text-blue-700 bg-blue-50 border-blue-200",
  academic: "text-purple-700 bg-purple-50 border-purple-200",
  admission: "text-green-700 bg-green-50 border-green-200",
  financial: "text-amber-700 bg-amber-50 border-amber-200",
};

type DocStatus = "pending" | "uploaded" | "verified";

// ── Tooltip ──────────────────────────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-gray-400 hover:text-purple-600 transition-colors"
        aria-label="More info"
      >
        <Info className="w-4 h-4" />
      </button>
      {show && (
        <div className="absolute z-20 left-6 top-0 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl leading-relaxed">
          {text}
          <div className="absolute left-0 top-2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: DocStatus }) {
  if (status === "verified")
    return (
      <Badge variant="success">
        <ShieldCheck className="w-3 h-3 mr-1" /> Verified
      </Badge>
    );
  if (status === "uploaded")
    return (
      <Badge variant="info">
        <CheckCircle className="w-3 h-3 mr-1" /> Uploaded
      </Badge>
    );
  return (
    <Badge variant="warning">
      <Clock className="w-3 h-3 mr-1" /> Pending
    </Badge>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LoanApplyPage() {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [docIdMap, setDocIdMap] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, DocStatus>>(
    Object.fromEntries(DOCUMENTS.map((d) => [d.id, "pending"]))
  );
  const [submitting, setSubmitting] = useState(false);

  // On mount: fetch or create the draft loan application
  useEffect(() => {
    const init = async () => {
      try {
        let app = await getCurrentLoanApplication().catch(() => null);

        if (!app) {
          app = await createLoanApplication({});
        }

        setApplicationId(app._id);

        // Build a map from our local doc id → MongoDB subdoc _id
        const idMap: Record<string, string> = {};
        const statusMap: Record<string, DocStatus> = Object.fromEntries(
          DOCUMENTS.map((d) => [d.id, "pending"])
        );

        // Seed documents into the application if not already there
        if (!app.documents || app.documents.length === 0) {
          // Documents will be added on first upload
        } else {
          app.documents.forEach((dbDoc: any) => {
            const local = DOCUMENTS.find((d) => d.name === dbDoc.name);
            if (local) {
              idMap[local.id] = dbDoc._id;
              statusMap[local.id] = dbDoc.status as DocStatus;
            }
          });
        }

        setDocIdMap(idMap);
        setStatuses(statusMap);
      } catch {
        // Offline / no application yet — work locally
      }
    };

    init();
  }, []);

  const handleUpload = async (id: string) => {
    const doc = DOCUMENTS.find((d) => d.id === id);
    if (!doc) return;

    // Optimistic update
    setStatuses((prev) => ({ ...prev, [id]: "uploaded" }));
    toast.success("Document uploaded!");

    if (applicationId) {
      try {
        let mongoId = docIdMap[id];

        // If this doc hasn't been added to the application yet, add it first
        if (!mongoId) {
          const { data } = await api.post(
            `/api/loan/applications/${applicationId}/documents`,
            { name: doc.name }
          );
          const newDoc = data.data?.documents?.find(
            (d: any) => d.name === doc.name
          );
          if (newDoc) {
            mongoId = newDoc._id;
            setDocIdMap((prev) => ({ ...prev, [id]: mongoId }));
          }
        }

        if (mongoId) {
          await updateDocumentStatus(applicationId, mongoId, "uploaded");
          // Simulate verification after 1.5s
          setTimeout(async () => {
            setStatuses((prev) => ({ ...prev, [id]: "verified" }));
            if (mongoId) {
              await updateDocumentStatus(applicationId, mongoId, "verified").catch(
                () => {}
              );
            }
          }, 1500);
        }
      } catch {
        // Silently degrade — local state already updated
      }
    } else {
      // No backend — just simulate verification
      setTimeout(() => {
        setStatuses((prev) => ({ ...prev, [id]: "verified" }));
      }, 1500);
    }
  };

  const uploadedCount = Object.values(statuses).filter(
    (s) => s !== "pending"
  ).length;
  const verifiedCount = Object.values(statuses).filter(
    (s) => s === "verified"
  ).length;
  const completionPct = Math.round((uploadedCount / DOCUMENTS.length) * 100);

  const handleSubmit = async () => {
    if (uploadedCount < DOCUMENTS.length * 0.6) {
      toast.error(
        "Please upload at least 60% of required documents before submitting."
      );
      return;
    }
    setSubmitting(true);
    try {
      if (applicationId) {
        await submitLoanApplication(applicationId);
      } else {
        await new Promise((r) => setTimeout(r, 1800));
      }
      toast.success(
        "Application submitted! You'll hear back within 3-5 business days."
      );
      router.push("/dashboard");
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Group documents by category
  const grouped = DOCUMENTS.reduce<Record<string, DocumentItem[]>>(
    (acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
    },
    {}
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-amber-100 rounded-xl">
            <FileText className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Loan Application
            </h1>
            <p className="text-gray-600">
              Upload your documents to complete the application
            </p>
          </div>
        </div>

        {/* Progress summary */}
        <Card padding="md" className="mb-8 bg-gradient-to-r from-purple-50 to-teal-50 border-purple-200">
          <div className="flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-xs text-gray-600 mb-1">Documents Uploaded</p>
              <p className="text-2xl font-bold text-purple-700">
                {uploadedCount} / {DOCUMENTS.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Verified</p>
              <p className="text-2xl font-bold text-green-700">
                {verifiedCount}
              </p>
            </div>
            <div className="flex-1 min-w-48">
              <p className="text-xs text-gray-600 mb-2">Completion</p>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{completionPct}%</p>
            </div>
          </div>
        </Card>

        {/* Document groups */}
        <div className="space-y-6 mb-8">
          {Object.entries(grouped).map(([category, docs]) => (
            <Card key={category} padding="md">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${categoryColors[category]}`}
              >
                {categoryLabels[category]}
              </div>

              <div className="space-y-3">
                {docs.map((doc) => {
                  const status = statuses[doc.id];
                  return (
                    <motion.div
                      key={doc.id}
                      layout
                      className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-white transition-colors"
                    >
                      {/* Status icon */}
                      <div className="flex-shrink-0">
                        {status === "verified" ? (
                          <ShieldCheck className="w-5 h-5 text-green-500" />
                        ) : status === "uploaded" ? (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {/* Name + tooltip */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              status === "verified"
                                ? "text-green-700"
                                : "text-gray-800"
                            }`}
                          >
                            {doc.name}
                          </span>
                          <InfoTooltip text={doc.why} />
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="flex-shrink-0 hidden sm:block">
                        <StatusBadge status={status} />
                      </div>

                      {/* Upload button */}
                      <div className="flex-shrink-0">
                        {status === "pending" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpload(doc.id)}
                          >
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            Upload
                          </Button>
                        ) : status === "uploaded" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpload(doc.id)}
                          >
                            Replace
                          </Button>
                        ) : (
                          <span className="text-xs text-green-600 font-medium px-2">
                            ✓ Done
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        {/* Application summary + submit */}
        <Card padding="lg" className="border-2 border-purple-200 bg-purple-50">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Banknote className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Application Summary
              </h3>
              <p className="text-sm text-gray-600">
                Review what will be submitted to the lender
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
            <div className="p-3 bg-white rounded-lg border border-purple-100">
              <p className="text-gray-500 text-xs mb-1">Documents Uploaded</p>
              <p className="font-semibold text-gray-900">
                {uploadedCount} of {DOCUMENTS.length} required documents
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-purple-100">
              <p className="text-gray-500 text-xs mb-1">Verified Documents</p>
              <p className="font-semibold text-green-700">
                {verifiedCount} documents verified
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-purple-100">
              <p className="text-gray-500 text-xs mb-1">Pending Documents</p>
              <p className="font-semibold text-amber-700">
                {DOCUMENTS.length - uploadedCount} still pending
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-purple-100">
              <p className="text-gray-500 text-xs mb-1">Processing Time</p>
              <p className="font-semibold text-gray-900">3–5 business days</p>
            </div>
          </div>

          {uploadedCount < DOCUMENTS.length * 0.6 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              ⚠️ Please upload at least{" "}
              {Math.ceil(DOCUMENTS.length * 0.6)} documents before submitting.
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              loading={submitting}
              disabled={uploadedCount < DOCUMENTS.length * 0.6}
            >
              Submit Application
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => router.push("/loan")}
            >
              ← Back to Loan Advisor
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
