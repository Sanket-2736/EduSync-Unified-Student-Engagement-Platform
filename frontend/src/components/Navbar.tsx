"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Menu, X, LogOut } from "lucide-react";
import { Button } from "./ui/Button";
import { useUserStore } from "@/store/userStore";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/tools/career-navigator", label: "Tools" },
  { href: "/loan", label: "Loan Advisor" },
  { href: "/chat", label: "Chat with Arya" },
];

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useUserStore();

  useEffect(() => { setIsOpen(false); }, [pathname]);

  const handleSignOut = () => {
    logout();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href={isAuthenticated ? "/dashboard" : "/"}
            className="flex items-center gap-2 font-bold text-xl text-purple-600"
          >
            <GraduationCap className="w-6 h-6" />
            <span>StudyAI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors ${
                  pathname === link.href
                    ? "text-purple-600"
                    : "text-gray-700 hover:text-purple-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                {/* User info */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-purple-50">
                  <span className="text-sm font-medium text-gray-700">
                    {user.name || "User"}
                  </span>
                  {user.points !== undefined && (
                    <span className="text-sm text-yellow-600">⭐{user.points}</span>
                  )}
                  {user.streak !== undefined && (
                    <span className="text-sm text-orange-600">🔥{user.streak}</span>
                  )}
                </div>

                {/* Dashboard button */}
                <Link href="/dashboard">
                  <Button size="sm" variant="primary">Dashboard</Button>
                </Link>

                {/* Logout button */}
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button size="sm" variant="ghost">Log In</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" variant="primary">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-in drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 md:hidden flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <Link
                  href="/"
                  className="flex items-center gap-2 font-bold text-purple-600"
                  onClick={() => setIsOpen(false)}
                >
                  <GraduationCap className="w-5 h-5" />
                  StudyAI
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer links */}
              <nav className="flex flex-col gap-1 p-4 flex-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                      pathname === link.href
                        ? "bg-purple-50 text-purple-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Drawer footer */}
              <div className="p-4 border-t border-gray-200 space-y-2">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-4 py-2 rounded-lg bg-purple-50 mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        {user.name || "User"}
                      </p>
                      <div className="flex gap-3 mt-1">
                        {user.points !== undefined && (
                          <span className="text-xs text-yellow-600">⭐{user.points}</span>
                        )}
                        {user.streak !== undefined && (
                          <span className="text-xs text-orange-600">🔥{user.streak}</span>
                        )}
                      </div>
                    </div>
                    <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="primary" className="w-full">Dashboard</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full text-red-500"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="secondary" className="w-full">Log In</Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsOpen(false)}>
                      <Button variant="primary" className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
