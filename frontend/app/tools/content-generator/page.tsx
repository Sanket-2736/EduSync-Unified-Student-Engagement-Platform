"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FileText, Mail, Briefcase, Share2, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useProfile } from "@/hooks/useProfile";
import { generateSOP, generateCoverLetter, generateEmail, generateSocialContent, type SOPResult, type CoverLetterResult, type EmailResult, type SocialContentResult } from "@/lib/api";

const EMAIL_TYPES = [
  { value: "professor_research", label: "Professor - Research Inquiry" },
  { value: "professor_phd", label: "Professor - PhD Interest" },
  { value: "admissions_inquiry", label: "Admissions - Program Inquiry" },
  { value: "admissions_status", label: "Admissions - Status Check" },
  { value: "scholarship_inquiry", label: "Scholarship Inquiry" },
];

const PLATFORMS = ["LinkedIn", "Twitter/X", "Instagram"];
const CONTENT_TYPES = ["Achievement Post", "Admission Announcement", "Internship Update", "Career Milestone"];

export default function ContentGeneratorPage() {
  const profile = useProfile();
  const [activeTab, setActiveTab] = useState<"sop" | "cover" | "email" | "social">("sop");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // SOP
  const [university, setUniversity] = useState("");
  const [program, setProgram] = useState("");
  const [sopResult, setSopResult] = useState<SOPResult | null>(null);

  // Cover Letter
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [coverResult, setCoverResult] = useState<CoverLetterResult | null>(null);

  // Email
  const [emailType, setEmailType] = useState("professor_research");
  const [emailUniversity, setEmailUniversity] = useState("");
  const [emailResult, setEmailResult] = useState<EmailResult | null>(null);

  // Social
  const [platform, setPlatform] = useState("LinkedIn");
  const [contentType, setContentType] = useState("Achievement Post");
  const [achievement, setAchievement] = useState("");
  const [socialResult, setSocialResult] = useState<SocialContentResult | null>(null);

  useEffect(() => {
    if (profile?.targetField) setProgram(`MS ${profile.targetField}`);
  }, [profile]);

  const handleGenerateSOP = async () => {
    if (!university || !program) {
      toast.error("Please enter university and program");
      return;
    }
    setLoading(true);
    setSopResult(null);
    try {
      const data = await generateSOP({
        name: profile?.name,
        university,
        program,
        gpa: profile?.gpa,
        greScore: profile?.greScore,
        workExp: profile?.workExperience,
        careerGoal: profile?.careerGoal,
        targetField: profile?.targetField,
        preferredCountry: profile?.preferredCountries?.[0],
      });
      setSopResult(data);
      toast.success("SOP generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate SOP");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!company || !role) {
      toast.error("Please enter company and role");
      return;
    }
    setLoading(true);
    setCoverResult(null);
    try {
      const data = await generateCoverLetter({
        name: profile?.name,
        company,
        role,
        careerGoal: profile?.careerGoal,
        targetField: profile?.targetField,
      });
      setCoverResult(data);
      toast.success("Cover letter generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate cover letter");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateEmail = async () => {
    if (!emailUniversity) {
      toast.error("Please enter university");
      return;
    }
    setLoading(true);
    setEmailResult(null);
    try {
      const data = await generateEmail({
        emailType,
        university: emailUniversity,
        senderName: profile?.name,
        targetField: profile?.targetField,
      });
      setEmailResult(data);
      toast.success("Email generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate email");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSocial = async () => {
    if (!achievement) {
      toast.error("Please describe your achievement");
      return;
    }
    setLoading(true);
    setSocialResult(null);
    try {
      const data = await generateSocialContent({
        platform,
        contentType,
        name: profile?.name,
        achievement,
        targetField: profile?.targetField,
        careerGoal: profile?.careerGoal,
      });
      setSocialResult(data);
      toast.success("Social content generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate content");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-teal-100 rounded-xl">
            <Sparkles className="w-7 h-7 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Content Generator</h1>
            <p className="text-gray-600">Create professional content for your study abroad journey</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8 overflow-x-auto">
          <Button variant={activeTab === "sop" ? "primary" : "ghost"} onClick={() => setActiveTab("sop")}>
            <FileText className="w-4 h-4 mr-2" /> SOP
          </Button>
          <Button variant={activeTab === "cover" ? "primary" : "ghost"} onClick={() => setActiveTab("cover")}>
            <Briefcase className="w-4 h-4 mr-2" /> Cover Letter
          </Button>
          <Button variant={activeTab === "email" ? "primary" : "ghost"} onClick={() => setActiveTab("email")}>
            <Mail className="w-4 h-4 mr-2" /> Email
          </Button>
          <Button variant={activeTab === "social" ? "primary" : "ghost"} onClick={() => setActiveTab("social")}>
            <Share2 className="w-4 h-4 mr-2" /> Social Media
          </Button>
        </div>

        {activeTab === "sop" && (
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Generate Statement of Purpose</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Input label="Target University" placeholder="e.g. Stanford University" value={university} onChange={(e) => setUniversity(e.target.value)} />
                <Input label="Program" placeholder="e.g. MS Computer Science" value={program} onChange={(e) => setProgram(e.target.value)} />
              </div>
              <Button variant="primary" className="mt-6" onClick={handleGenerateSOP} loading={loading}>Generate SOP</Button>
            </Card>

            {sopResult && (
              <div className="space-y-6">
                <Card padding="lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Your Statement of Purpose</h3>
                    <div className="flex gap-2">
                      <Badge variant="info">{sopResult.wordCount} words</Badge>
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(sopResult.sop)}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{sopResult.sop}</p>
                  </div>
                </Card>

                <Card padding="md">
                  <h4 className="font-bold text-gray-900 mb-3">Key Highlights</h4>
                  <ul className="space-y-2">
                    {sopResult.highlights.map((h, i) => <li key={i} className="text-sm text-gray-700">✓ {h}</li>)}
                  </ul>
                </Card>

                <Card padding="md" className="bg-amber-50 border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-3">Improvement Suggestions</h4>
                  <ul className="space-y-2">
                    {sopResult.improvementSuggestions.map((s, i) => <li key={i} className="text-sm text-amber-800">• {s}</li>)}
                  </ul>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === "cover" && (
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Generate Cover Letter</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Input label="Company Name" placeholder="e.g. Google" value={company} onChange={(e) => setCompany(e.target.value)} />
                <Input label="Role" placeholder="e.g. Software Engineer Intern" value={role} onChange={(e) => setRole(e.target.value)} />
              </div>
              <Button variant="primary" className="mt-6" onClick={handleGenerateCover} loading={loading}>Generate Cover Letter</Button>
            </Card>

            {coverResult && (
              <div className="space-y-6">
                <Card padding="lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Your Cover Letter</h3>
                    <Button size="sm" variant="ghost" onClick={() => handleCopy(coverResult.coverLetter)}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Subject: {coverResult.subjectLine}</p>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{coverResult.coverLetter}</p>
                  </div>
                </Card>

                <Card padding="md">
                  <h4 className="font-bold text-gray-900 mb-3">Key Selling Points</h4>
                  <ul className="space-y-2">
                    {coverResult.keySellingPoints.map((p, i) => <li key={i} className="text-sm text-gray-700">�� {p}</li>)}
                  </ul>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === "email" && (
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Generate Professional Email</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Type</label>
                  <select value={emailType} onChange={(e) => setEmailType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {EMAIL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <Input label="University" placeholder="e.g. MIT" value={emailUniversity} onChange={(e) => setEmailUniversity(e.target.value)} />
              </div>
              <Button variant="primary" className="mt-6" onClick={handleGenerateEmail} loading={loading}>Generate Email</Button>
            </Card>

            {emailResult && (
              <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Your Email</h3>
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(`Subject: ${emailResult.subject}\n\n${emailResult.emailBody}`)}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Subject: {emailResult.subject}</p>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{emailResult.emailBody}</p>
                </div>
                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2 text-sm">✓ Do</h4>
                    <ul className="text-xs text-green-800 space-y-1">
                      {emailResult.doList.map((d, i) => <li key={i}>• {d}</li>)}
                    </ul>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2 text-sm">✗ Don't</h4>
                    <ul className="text-xs text-red-800 space-y-1">
                      {emailResult.dontList.map((d, i) => <li key={i}>• {d}</li>)}
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Generate Social Media Content</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                  <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {CONTENT_TYPES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Input label="Achievement/Topic" placeholder="e.g. Got admitted to Stanford for MS CS" value={achievement} onChange={(e) => setAchievement(e.target.value)} />
                </div>
              </div>
              <Button variant="primary" className="mt-6" onClick={handleGenerateSocial} loading={loading}>Generate Post</Button>
            </Card>

            {socialResult && (
              <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Your {platform} Post</h3>
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(socialResult.mainPost)}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl mb-4">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{socialResult.mainPost}</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {socialResult.hashtags.map((tag, i) => <Badge key={i} variant="info">{tag}</Badge>)}
                </div>
                <p className="text-xs text-gray-500">Best time to post: {socialResult.bestPostingTime}</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
