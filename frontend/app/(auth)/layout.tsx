import React from "react";
import { Toaster } from "react-hot-toast";

/**
 * Auth route group layout — no Navbar, no ProtectedRoute wrapper.
 */
export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}
