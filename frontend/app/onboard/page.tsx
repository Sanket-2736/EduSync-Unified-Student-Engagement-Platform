"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useUserStore } from "@/store/userStore";
import { updateUserProfile } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface FormData {
  // Step 1
  name: string;
  email: string;
  phone: string;
  city: string;
  // Step 2
  undergradDegree: string;
  gpa: number;
  greScore: number;
  ieltsScore: number;
  toeflScore: number;
  // Step 3
  targetField: string;
  preferredCountries: string[];
  studyTimeline: string;
  // Step 4
  familyIncome: number;
  educationBudget: number;
  hasCollateral: boolean;
  // Step 5
  careerGoal: string;
  biggestConcerns: string[];
}

const initialFormData: FormData = {
  name: "",
  email: "",
  phone: "",
  city: "",
  undergradDegree: "",
  gpa: 3.5,
  greScore: 300,
  ieltsScore: 0,
  toeflScore: 0,
  targetField: "",
  preferredCountries: [],
  studyTimeline: "2025",
  familyIncome: 25,
  educationBudget: 50,
  hasCollateral: false,
  careerGoal: "",
  biggestConcerns: [],
};

const countries = ["USA", "UK", "Canada", "Germany", "Australia", "Singapore"];
const fields = ["Computer Science", "MBA", "Engineering", "Data Science", "Medicine", "Law"];
const concerns = ["Visa", "Loans", "Admission", "Accommodation"];

export default function OnboardPage() {
  const router = useRouter();
  const { user, userId, setUser } = useUserStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);

  // Pre-fill form with existing user data
  useEffect(() => {
    if (user) {
      const academics = (user.profile as any)?.academics || {};
      const preferences = (user.profile as any)?.preferences || {};
      const finances = (user.profile as any)?.finances || {};
      const goals = (user.profile as any)?.goals || {};

      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        city: user.city || "",
        undergradDegree: academics.undergradDegree || "",
        gpa: academics.gpa || 3.5,
        greScore: academics.greScore || 300,
        ieltsScore: academics.ieltsScore || 0,
        toeflScore: academics.toeflScore || 0,
        targetField: preferences.targetField || "",
        preferredCountries: preferences.preferredCountries || [],
        studyTimeline: preferences.studyTimeline || "2025",
        familyIncome: finances.familyIncome || 25,
        educationBudget: finances.educationBudget || 50,
        hasCollateral: finances.hasCollateral || false,
        careerGoal: goals.careerGoal || "",
        biggestConcerns: goals.biggestConcerns || [],
      }));
    }
  }, [user]);

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCountryToggle = (country: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredCountries: prev.preferredCountries.includes(country)
        ? prev.preferredCountries.filter((c) => c !== country)
        : [...prev.preferredCountries, country],
    }));
  };

  const handleConcernToggle = (concern: string) => {
    setFormData((prev) => ({
      ...prev,
      biggestConcerns: prev.biggestConcerns.includes(concern)
        ? prev.biggestConcerns.filter((c) => c !== concern)
        : [...prev.biggestConcerns, concern],
    }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.name || !formData.email) {
          toast.error("Name and email are required");
          return false;
        }
        break;
      case 2:
        if (!formData.undergradDegree) {
          toast.error("Please select your undergraduate degree");
          return false;
        }
        break;
      case 3:
        if (!formData.targetField || formData.preferredCountries.length === 0) {
          toast.error("Please select a field and at least one country");
          return false;
        }
        break;
      case 5:
        if (!formData.careerGoal) {
          toast.error("Please enter your career goal");
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      if (!userId) {
        toast.error("User ID not found. Please log in again.");
        router.push("/login");
        return;
      }

      // Map form fields to the nested schema structure MongoDB expects
      const updatedUser = await updateUserProfile(userId, {
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        onboardingComplete: true,
        profile: {
          academics: {
            undergradDegree: formData.undergradDegree,
            gpa: formData.gpa,
            greScore: formData.greScore,
            ieltsScore: formData.ieltsScore,
            toeflScore: formData.toeflScore,
          },
          preferences: {
            targetField: formData.targetField,
            preferredCountries: formData.preferredCountries,
            studyTimeline: formData.studyTimeline,
          },
          finances: {
            familyIncome: formData.familyIncome,
            educationBudget: formData.educationBudget,
            hasCollateral: formData.hasCollateral,
          },
          goals: {
            careerGoal: formData.careerGoal,
            biggestConcerns: formData.biggestConcerns,
          },
        },
      });

      // Update Zustand store with new user data
      setUser({ _id: userId, ...updatedUser });

      toast.success("Profile completed! Welcome to StudyAI! 🎉");
      router.push("/dashboard");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message || "Failed to update profile";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar percentage={progress} showLabel={false} />
          <p className="text-center text-sm text-gray-600 mt-2">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Form Card */}
        <Card padding="lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Personal Information
                  </h2>
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) =>
                      handleInputChange("name", e.target.value)
                    }
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      handleInputChange("email", e.target.value)
                    }
                  />
                  <Input
                    label="Phone (Optional)"
                    placeholder="+91-9876543210"
                    value={formData.phone}
                    onChange={(e) =>
                      handleInputChange("phone", e.target.value)
                    }
                  />
                  <Input
                    label="City (Optional)"
                    placeholder="Your city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                  />
                </div>
              )}

              {/* Step 2: Academic Background */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Academic Background
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Undergraduate Degree
                    </label>
                    <select
                      value={formData.undergradDegree}
                      onChange={(e) =>
                        handleInputChange("undergradDegree", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select degree</option>
                      <option value="B.Tech">B.Tech</option>
                      <option value="B.Sc">B.Sc</option>
                      <option value="B.A">B.A</option>
                      <option value="B.Com">B.Com</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <Slider
                    label="GPA / CGPA (0-10)"
                    min={0}
                    max={10}
                    step={0.1}
                    value={formData.gpa}
                    onChange={(value) => handleInputChange("gpa", value)}
                    formatValue={(v) => v.toFixed(2)}
                  />
                  <Slider
                    label="GRE Score (260-340)"
                    min={260}
                    max={340}
                    value={formData.greScore}
                    onChange={(value) => handleInputChange("greScore", value)}
                  />
                  <Input
                    label="IELTS Score (Optional)"
                    type="number"
                    placeholder="0-9"
                    value={formData.ieltsScore || ""}
                    onChange={(e) =>
                      handleInputChange("ieltsScore", Number(e.target.value))
                    }
                  />
                  <Input
                    label="TOEFL Score (Optional)"
                    type="number"
                    placeholder="0-120"
                    value={formData.toeflScore || ""}
                    onChange={(e) =>
                      handleInputChange("toeflScore", Number(e.target.value))
                    }
                  />
                </div>
              )}

              {/* Step 3: Preferences */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Study Preferences
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Field
                    </label>
                    <select
                      value={formData.targetField}
                      onChange={(e) =>
                        handleInputChange("targetField", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select field</option>
                      {fields.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Preferred Countries
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {countries.map((country) => (
                        <label
                          key={country}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.preferredCountries.includes(
                              country
                            )}
                            onChange={() => handleCountryToggle(country)}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600"
                          />
                          <span className="text-gray-700">{country}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Study Timeline
                    </label>
                    <select
                      value={formData.studyTimeline}
                      onChange={(e) =>
                        handleInputChange("studyTimeline", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 4: Financial */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Financial Information
                  </h2>
                  <Slider
                    label="Annual Family Income (₹ Lakhs)"
                    min={0}
                    max={50}
                    step={1}
                    value={formData.familyIncome}
                    onChange={(value) =>
                      handleInputChange("familyIncome", value)
                    }
                    formatValue={(v) => `₹${v}L`}
                  />
                  <Slider
                    label="Education Budget (USD Thousands)"
                    min={20}
                    max={100}
                    step={5}
                    value={formData.educationBudget}
                    onChange={(value) =>
                      handleInputChange("educationBudget", value)
                    }
                    formatValue={(v) => `$${v}k`}
                  />
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={formData.hasCollateral}
                        onChange={(e) =>
                          handleInputChange("hasCollateral", e.target.checked)
                        }
                        className="w-4 h-4 rounded border-gray-300 text-purple-600"
                      />
                      <span className="text-gray-700 font-medium">
                        I have collateral for education loan
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 5: Goals */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Career Goals
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Career Goal
                    </label>
                    <textarea
                      value={formData.careerGoal}
                      onChange={(e) =>
                        handleInputChange("careerGoal", e.target.value)
                      }
                      placeholder="Describe your career aspirations..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Biggest Concerns
                    </label>
                    <div className="space-y-2">
                      {concerns.map((concern) => (
                        <label
                          key={concern}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.biggestConcerns.includes(concern)}
                            onChange={() => handleConcernToggle(concern)}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600"
                          />
                          <span className="text-gray-700">{concern}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            <div className="flex-1" />
            {currentStep === totalSteps ? (
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
              >
                Complete Onboarding
              </Button>
            ) : (
              <Button variant="primary" onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
