"use client";

import { useUserStore } from "@/store/userStore";

/**
 * Returns a flat, tool-ready profile object derived from the
 * nested Zustand store. Every tool imports this — no tool ever
 * reads localStorage directly or asks the user to re-enter data.
 */
export function useProfile() {
  const { user } = useUserStore();

  if (!user) return null;

  const academics   = (user.profile as any)?.academics   ?? {};
  const preferences = (user.profile as any)?.preferences ?? {};
  const finances    = (user.profile as any)?.finances    ?? {};
  const goals       = (user.profile as any)?.goals       ?? {};

  return {
    // Identity
    name:               user.name,
    email:              user.email,

    // Academics
    undergradDegree:    academics.undergradDegree   as string  | undefined,
    gpa:                academics.gpa               as number  | undefined,
    greScore:           academics.greScore          as number  | undefined,
    ieltsScore:         academics.ieltsScore        as number  | undefined,
    toeflScore:         academics.toeflScore        as number  | undefined,
    workExperience:     academics.workExperience    as number  | undefined,

    // Preferences
    targetField:        preferences.targetField     as string  | undefined,
    preferredCountries: preferences.preferredCountries as string[] | undefined,
    studyTimeline:      preferences.studyTimeline   as string  | undefined,

    // Finances
    educationBudget:    finances.educationBudget    as number  | undefined,
    familyIncome:       finances.familyIncome       as number  | undefined,
    hasCollateral:      finances.hasCollateral      as boolean | undefined,

    // Goals
    careerGoal:         goals.careerGoal            as string  | undefined,
    biggestConcerns:    goals.biggestConcerns       as string[] | undefined,
  };
}

export type UserProfile = NonNullable<ReturnType<typeof useProfile>>;
