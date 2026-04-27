"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Compass,
  TrendingUp,
  GraduationCap,
  Banknote,
  ArrowRight,
  BookOpen,
  Sparkles,
  MessageCircle,
  CheckCircle,
  Users,
  Globe,
  Award,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useUserStore } from "@/store/userStore";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export default function Home() {
  const { isAuthenticated } = useUserStore();

  const tools = [
    {
      icon: Compass,
      title: "Career Navigator",
      description:
        "Get personalized university and course recommendations based on your profile.",
    },
    {
      icon: TrendingUp,
      title: "ROI Calculator",
      description:
        "Calculate the return on investment for your education and career growth.",
    },
    {
      icon: GraduationCap,
      title: "Admission Predictor",
      description:
        "Predict your admission chances and get actionable improvement tips.",
    },
    {
      icon: Banknote,
      title: "Loan Advisor",
      description:
        "Find the best education loan options and repayment plans for your needs.",
    },
    {
      icon: BookOpen,
      title: "Test Prep Hub",
      description:
        "Adaptive practice tests and personalized study plans for GRE, GMAT, IELTS, TOEFL.",
    },
    {
      icon: Sparkles,
      title: "Content Generator",
      description:
        "AI-powered SOP, cover letters, emails, and social media content.",
    },
  ];

  const features = [
    {
      icon: MessageCircle,
      title: "Arya - AI Mentor",
      description: "24/7 streaming AI mentor who knows your profile and guides you through every step.",
    },
    {
      icon: CheckCircle,
      title: "Deterministic Scoring",
      description: "Application strength and loan risk scores based on pure math, not LLM guessing.",
    },
    {
      icon: Users,
      title: "Profile-Aware Tools",
      description: "All tools pre-filled with your data — no re-entry needed across the platform.",
    },
    {
      icon: Globe,
      title: "15+ Countries",
      description: "Coverage for USA, UK, Canada, Germany, Australia, Singapore, and more.",
    },
    {
      icon: Award,
      title: "Gamification",
      description: "Earn points, badges, and maintain streaks as you progress through your journey.",
    },
    {
      icon: Zap,
      title: "Real-Time Insights",
      description: "Instant recommendations powered by Cerebras AI with streaming responses.",
    },
  ];

  const stats = [
    { number: "10,000+", label: "Students Guided" },
    { number: "500+", label: "Universities" },
    { number: "₹50Cr+", label: "Loans Facilitated" },
    { number: "15+", label: "Countries Covered" },
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      university: "Stanford University",
      text: "StudyAI helped me get into Stanford with a full scholarship. The ROI calculator and admission predictor were game-changers!",
      avatar: "PS",
    },
    {
      name: "Rahul Verma",
      university: "University of Toronto",
      text: "The loan advisor saved me lakhs! I found the perfect lender with the best interest rates in minutes.",
      avatar: "RV",
    },
    {
      name: "Ananya Patel",
      university: "TU Munich",
      text: "Arya, the AI mentor, felt like having a personal counselor. She knew my profile and gave spot-on advice.",
      avatar: "AP",
    },
  ];

  const comparisonPoints = [
    "Profile-aware AI tools that remember your data",
    "Deterministic scoring engine (not LLM guessing)",
    "Streaming AI mentor with full profile context",
    "Loan risk flagging with salary projections",
    "Gamification with points, badges, and streaks",
    "Test prep with adaptive questions and study plans",
    "AI content generator for SOPs, emails, and more",
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <motion.div className="text-center" variants={fadeInUp}>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Your AI-Powered Study Abroad{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-teal-600">
              Companion
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            From university selection to education loans — guided by AI, built
            for Indian students
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          variants={fadeInUp}
        >
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" variant="primary">
                Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/signup">
                <Button size="lg" variant="primary">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <motion.h2
          className="text-4xl font-bold text-center mb-4 text-gray-900"
          variants={fadeInUp}
        >
          Why StudyAI?
        </motion.h2>
        <motion.p
          className="text-center text-gray-600 mb-12 max-w-2xl mx-auto"
          variants={fadeInUp}
        >
          The only platform that combines AI-powered tools with deterministic scoring and profile-aware recommendations
        </motion.p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={index} variants={fadeInUp}>
                <Card padding="md" className="h-full hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <Icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Tools Section */}
      <motion.section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <motion.h2
          className="text-4xl font-bold text-center mb-12 text-gray-900"
          variants={fadeInUp}
        >
          All-in-One AI Tools
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.div key={index} variants={fadeInUp}>
                <Card padding="md" className="h-full hover:shadow-md transition-shadow">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-purple-100 rounded-lg mb-4">
                      <Icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {tool.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{tool.description}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Comparison Section */}
      <motion.section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-r from-purple-50 to-teal-50"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <motion.h2
          className="text-4xl font-bold text-center mb-4 text-gray-900"
          variants={fadeInUp}
        >
          What Makes Us Different
        </motion.h2>
        <motion.p
          className="text-center text-gray-600 mb-12 max-w-2xl mx-auto"
          variants={fadeInUp}
        >
          Unlike other platforms, we don't just give generic advice — we know your profile and adapt to you
        </motion.p>
        <div className="max-w-3xl mx-auto">
          <Card padding="lg" className="bg-white">
            <div className="space-y-4">
              {comparisonPoints.map((point, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3"
                  variants={fadeInUp}
                >
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{point}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <motion.h2
          className="text-4xl font-bold text-center mb-12 text-gray-900"
          variants={fadeInUp}
        >
          Success Stories
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card padding="md" className="h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-xs text-gray-500">{testimonial.university}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm italic">"{testimonial.text}"</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="grid md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              variants={fadeInUp}
            >
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">
                {stat.number}
              </div>
              <p className="text-gray-600 text-lg">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <Card padding="lg" className="bg-gradient-to-r from-purple-600 to-teal-600 text-white text-center">
          <motion.div variants={fadeInUp}>
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of Indian students who have found their perfect
              university with StudyAI
            </p>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="text-purple-600">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="text-purple-600">
                  Get Started Free
                </Button>
              </Link>
            )}
          </motion.div>
        </Card>
      </motion.section>
    </div>
  );
}
