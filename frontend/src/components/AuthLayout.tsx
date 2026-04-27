import React from "react";
import Link from "next/link";
import { GraduationCap, Sparkles, Globe, TrendingUp } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const features = [
  { icon: Globe, text: "Explore 500+ universities across 10 countries" },
  { icon: TrendingUp, text: "AI-powered ROI and admission predictions" },
  { icon: Sparkles, text: "Personalised mentor — available 24/7" },
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ── Left panel ──────────────────────────────────────────────────────── */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-purple-700 via-purple-600 to-teal-600 text-white flex-col justify-between p-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <GraduationCap className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight">StudyAI</span>
        </Link>

        {/* Tagline */}
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Your AI-powered<br />study abroad companion
          </h1>
          <p className="text-purple-100 text-lg mb-10">
            From university selection to education loans — guided by AI, built
            for Indian students.
          </p>

          {/* Feature list */}
          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="p-1.5 bg-white/20 rounded-lg flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-purple-100 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-purple-200 text-xs">
          © {new Date().getFullYear()} StudyAI · Built for Indian students
        </p>
      </div>

      {/* ── Right panel (form) ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-gray-50">
        {/* Mobile logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-purple-600 font-bold text-xl mb-8 md:hidden"
        >
          <GraduationCap className="w-6 h-6" />
          StudyAI
        </Link>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
