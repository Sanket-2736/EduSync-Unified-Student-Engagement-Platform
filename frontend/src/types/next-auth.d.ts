import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      userId: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      onboardingComplete: boolean;
      points: number;
      streak: number;
    };
  }

  interface User {
    dbId?: string;
    onboardingComplete?: boolean;
    points?: number;
    streak?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    onboardingComplete?: boolean;
    points?: number;
    streak?: number;
  }
}
