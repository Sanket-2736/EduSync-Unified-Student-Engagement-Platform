"use client";

import React, { useEffect } from "react";
import { useUserStore } from "@/store/userStore";

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const loadFromStorage = useUserStore((state) => state.loadFromStorage);

  // Load auth state on app boot
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return <>{children}</>;
};
