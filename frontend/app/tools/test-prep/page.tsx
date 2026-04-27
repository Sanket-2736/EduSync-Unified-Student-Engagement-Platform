"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { BookOpen, Brain, Target, CheckCircle, XCircle, Clock, Lightbulb, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { useProfile } from "@/hooks/useProfile";
import { generateTestQuestions, generateStudyPlan, type TestPrepQuestion, type StudyPlanResult } from "@/lib/api";

const TESTS = ["GRE", "GMAT", "IELTS", "TOEFL"];
const GRE_SECTIONS = ["Verbal Reasoning", "Quantitative Reasoning", "Analytical Writing"];
const GMAT_SECTIONS = ["Verbal", "Quantitative", "Integrated Reasoning", "Analytical Writing"];
const IELTS_SECTIONS = ["Listening", "Reading", "Writing", "Speaking"];
const TOEFL_SECTIONS = ["Reading", "Listening", "Speaking", "Writing"];

const SECTION_MAP: Record<string, string[]> = {
  GRE: GRE_SECTIONS,
  GMAT: GMAT_SECTIONS,
  IELTS: IELTS_SECTIONS,
  TOEFL: TOEFL_SECTIONS,
};

export default function TestPrepPage() {
  const profile = useProfile();
  const [activeTab, setActiveTab] = useState<"practice" | "plan">("practice");
  const [test, setTest] = useState("GRE");
  const [section, setSection] = useState(GRE_SECTIONS[0]);
  const [difficulty, setDifficulty] = useState("Medium");
  const [currentScore, setCurrentScore] = useState(300);
  const [targetScore, setTargetScore] = useState(320);
  const [weeksAvailable, setWeeksAvailable] = useState(12);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<TestPrepQuestion[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlanResult | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleTestChange = (newTest: string) => {
    setTest(newTest);
    setSection(SECTION_MAP[newTest][0]);
  };

  const handleGenerateQuestions = async () => {
    setLoading(true);
    setQuestions([]);
    setUserAnswers({});
    setShowResults(false);
    try {
      const data = await generateTestQuestions({ test, section, difficulty, currentScore, targetScore, count: 5 });
      setQuestions(data.questions);
      toast.success("Questions generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    setStudyPlan(null);
    try {
      const data = await generateStudyPlan({ test, currentScore, targetScore, weeksAvailable });
      setStudyPlan(data);
      toast.success("Study plan created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate study plan");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(userAnswers).length < questions.length) {
      toast.error("Please answer all questions");
      return;
    }
    setShowResults(true);
    const correct = questions.filter((q) => userAnswers[q.id] === q.correctAnswer).length;
    toast.success(`You scored ${correct}/${questions.length}!`);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <BookOpen className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Preparation Hub</h1>
            <p className="text-gray-600">Adaptive practice tests and personalized study plans</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <Button variant={activeTab === "practice" ? "primary" : "ghost"} onClick={() => setActiveTab("practice")}>
            <Brain className="w-4 h-4 mr-2" /> Practice Questions
          </Button>
          <Button variant={activeTab === "plan" ? "primary" : "ghost"} onClick={() => setActiveTab("plan")}>
            <Calendar className="w-4 h-4 mr-2" /> Study Plan
          </Button>
        </div>

        {activeTab === "practice" && (
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Generate Practice Questions</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Test</label>
                  <select value={test} onChange={(e) => handleTestChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {TESTS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {SECTION_MAP[test].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <Slider label="Current Score" min={260} max={340} value={currentScore} onChange={setCurrentScore} />
              </div>
              <Button variant="primary" className="mt-6" onClick={handleGenerateQuestions} loading={loading}>Generate Questions</Button>
            </Card>

            {questions.length > 0 && (
              <Card padding="lg">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Practice Questions</h3>
                <div className="space-y-6">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Q{idx + 1}. {q.question}</h4>
                        <Badge variant="info">{q.difficulty}</Badge>
                      </div>
                      {q.options && (
                        <div className="space-y-2 mb-4">
                          {q.options.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name={`q${q.id}`} value={opt} checked={userAnswers[q.id] === opt} onChange={(e) => setUserAnswers({ ...userAnswers, [q.id]: e.target.value })} className="text-purple-600" />
                              <span className="text-sm text-gray-700">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {showResults && (
                        <div className={`mt-4 p-3 rounded-lg ${userAnswers[q.id] === q.correctAnswer ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {userAnswers[q.id] === q.correctAnswer ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                            <span className="font-semibold">{userAnswers[q.id] === q.correctAnswer ? "Correct!" : "Incorrect"}</span>
                          </div>
                          <p className="text-sm text-gray-700"><strong>Correct Answer:</strong> {q.correctAnswer}</p>
                          <p className="text-sm text-gray-600 mt-2">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {!showResults && <Button variant="primary" className="mt-6" onClick={handleSubmitQuiz}>Submit Quiz</Button>}
              </Card>
            )}
          </div>
        )}

        {activeTab === "plan" && (
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Create Study Plan</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Test</label>
                  <select value={test} onChange={(e) => setTest(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {TESTS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <Slider label="Weeks Available" min={4} max={24} value={weeksAvailable} onChange={setWeeksAvailable} />
                <Slider label="Current Score" min={260} max={340} value={currentScore} onChange={setCurrentScore} />
                <Slider label="Target Score" min={260} max={340} value={targetScore} onChange={setTargetScore} />
              </div>
              <Button variant="primary" className="mt-6" onClick={handleGeneratePlan} loading={loading}>Generate Study Plan</Button>
            </Card>

            {studyPlan && (
              <div className="space-y-6">
                <Card padding="md" className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                  <h3 className="font-bold text-gray-900 mb-2">{studyPlan.overview}</h3>
                  <div className="flex gap-4 text-sm">
                    <span>Score Gap: <strong>{studyPlan.scoreGap}</strong></span>
                    <span>Feasibility: <Badge variant="success">{studyPlan.feasibility}</Badge></span>
                  </div>
                </Card>

                <Card padding="lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Plan</h3>
                  <div className="space-y-4">
                    {studyPlan.weeklyPlan.slice(0, 4).map((week) => (
                      <div key={week.week} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">Week {week.week}: {week.focus}</h4>
                          <Badge variant="info">{week.dailyHours}h/day</Badge>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1 mb-2">
                          {week.tasks.slice(0, 3).map((task, i) => <li key={i}>• {task}</li>)}
                        </ul>
                        <p className="text-xs text-purple-600 font-medium">🎯 {week.milestone}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card padding="lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended Resources</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {studyPlan.resourceRecommendations.map((res, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900">{res.name}</h4>
                        <p className="text-xs text-gray-500">{res.type} • {res.free ? "Free" : "Paid"}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
