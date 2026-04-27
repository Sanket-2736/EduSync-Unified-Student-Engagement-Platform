import { create } from "zustand";
import { getToken, saveToken, clearToken, saveUserId, getUserId, saveProfile, getProfile, clearAll } from "@/lib/storage";
import { getUserProfile } from "@/lib/api";

export interface UserProfile {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  undergradDegree?: string;
  gpa?: number;
  greScore?: number;
  ieltsScore?: number;
  toeflScore?: number;
  targetField?: string;
  preferredCountries?: string[];
  studyTimeline?: string;
  familyIncome?: number;
  educationBudget?: number;
  hasCollateral?: boolean;
  careerGoal?: string;
  biggestConcerns?: string[];
  workExperience?: number;
  points?: number;
  streak?: number;
  onboardingComplete?: boolean;
  [key: string]: unknown;
}

interface UserStore {
  userId: string | null;
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  points: number;
  streak: number;

  // Actions
  setAuth: (userId: string, token: string, user: UserProfile) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  userId: null,
  token: null,
  user: null,
  isLoading: false,
  isAuthenticated: false,
  points: 0,
  streak: 0,

  setAuth: (userId: string, token: string, user: UserProfile) => {
    // Save to state
    set({
      userId,
      token,
      user,
      isAuthenticated: true,
      points: user.points || 0,
      streak: user.streak || 0,
    });

    // Save to localStorage
    saveUserId(userId);
    saveToken(token);
    saveProfile(user);

    // Save token to cookie (already done in saveToken, but explicit here)
    saveToken(token);
  },

  setUser: (user: UserProfile) => {
    set({
      user,
      points: user.points || 0,
      streak: user.streak || 0,
    });
    saveProfile(user);
  },

  logout: () => {
    set({
      userId: null,
      token: null,
      user: null,
      isAuthenticated: false,
      points: 0,
      streak: 0,
    });

    // Clear all storage
    clearAll();

    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  loadFromStorage: async () => {
    set({ isLoading: true });

    try {
      const token = getToken();
      const userId = getUserId();
      const cachedProfile = getProfile();

      if (!token || !userId) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Try to fetch fresh user profile from API
      try {
        const freshUser = await getUserProfile(userId);
        set({
          userId,
          token,
          user: freshUser,
          isAuthenticated: true,
          isLoading: false,
          points: freshUser.points || 0,
          streak: freshUser.streak || 0,
        });
        saveProfile(freshUser);
      } catch (error) {
        // If API fails, fall back to cached profile
        if (cachedProfile) {
          set({
            userId,
            token,
            user: cachedProfile as UserProfile,
            isAuthenticated: true,
            isLoading: false,
            points: (cachedProfile as UserProfile).points || 0,
            streak: (cachedProfile as UserProfile).streak || 0,
          });
        } else {
          // No cached profile and API failed, clear auth
          clearAll();
          set({ isLoading: false, isAuthenticated: false });
        }
      }
    } catch (error) {
      console.error("Error loading from storage:", error);
      set({ isLoading: false, isAuthenticated: false });
    }
  },
}));
