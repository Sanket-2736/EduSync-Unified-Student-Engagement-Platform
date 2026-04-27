# Global State Management & Route Protection Setup

## Overview
This document outlines the global state management and route protection system implemented using Zustand and Next.js routing with JWT authentication.

**Note:** NextAuth has been removed. The system uses pure JWT authentication with Zustand for state management.

## Files Created/Modified

### 1. **frontend/src/store/userStore.ts** (NEW)
Zustand store for managing global user authentication state.

**Store Shape:**
```typescript
{
  userId: string | null;
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  points: number;
  streak: number;
}
```

**Actions:**
- `setAuth(userId, token, user)` - Sets authentication state and persists to localStorage + cookie
- `setUser(user)` - Updates user profile and persists to localStorage
- `logout()` - Clears all state, localStorage, cookie, and redirects to /login
- `loadFromStorage()` - Loads auth state from localStorage on app boot and hydrates user profile from API

**Key Features:**
- Persists token to both localStorage and document.cookie
- Automatically hydrates user profile from GET /api/users/{userId} on app boot
- Falls back to cached profile if API fails
- Clears all arya_chat_* keys on logout

### 2. **frontend/src/components/Providers.tsx** (NEW)
Client-side providers wrapper that initializes auth state on app boot.

**Responsibilities:**
- Wraps SessionProvider from next-auth
- Calls `loadFromStorage()` on mount to hydrate auth state
- Provides context for all child components

### 3. **frontend/src/components/ProtectedRoute.tsx** (NEW)
Route protection component that enforces authentication on protected pages.

**Public Routes (no auth required):**
- `/`
- `/login`
- `/signup`
- `/tools/career-navigator`
- `/tools/roi-calculator`
- `/tools/admission-predictor`

**Protected Routes (auth required):**
- `/dashboard`
- `/tools/career-navigator` (when accessed from authenticated context)
- `/tools/roi-calculator` (when accessed from authenticated context)
- `/tools/admission-predictor` (when accessed from authenticated context)
- `/chat`
- `/loan`
- `/loan/apply`

**Behavior:**
- Shows LoadingSpinner while checking auth state
- Redirects unauthenticated users to /login
- Allows public routes regardless of auth state
- Renders children if authenticated

### 4. **frontend/app/layout.tsx** (MODIFIED)
Updated root layout to use new Providers component.

**Changes:**
- Replaced `SessionProviderWrapper` with `Providers`
- Providers now handles auth initialization on app boot
- ProtectedRoute wraps all children

### 5. **frontend/src/components/Navbar.tsx** (MODIFIED)
Updated to use Zustand store instead of localStorage checks.

**New Features:**
- Displays user name from store
- Shows points (⭐{points}) if available
- Shows streak (🔥{streak}) if available
- Logout button calls `useUserStore.logout()`
- Responsive design for mobile and desktop

**Behavior:**
- Desktop: Shows user info, dashboard button, and logout button when authenticated
- Mobile: Shows user info in drawer footer with dashboard and logout options
- Unauthenticated: Shows "Log In" and "Get Started" buttons

### 6. **frontend/src/lib/api.ts** (MODIFIED)
Updated API interceptors to use Zustand store.

**Request Interceptor:**
- Reads token from localStorage (via getToken())
- Attaches `Authorization: Bearer {token}` header to all requests

**Response Interceptor:**
- On 401: Calls `useUserStore.getState().logout()` to clear auth and redirect to /login
- On 5xx: Shows error toast

### 7. **frontend/src/components/ui/Slider.tsx** (MODIFIED)
Fixed TypeScript error with onChange prop by using Omit utility type.

## Usage Examples

### Setting Authentication After Login
```typescript
import { useUserStore } from "@/store/userStore";

const { setAuth } = useUserStore();

// After successful login API call
setAuth(userId, token, userProfile);
// This automatically:
// - Saves to state
// - Persists to localStorage
// - Saves token to cookie
```

### Logging Out
```typescript
import { useUserStore } from "@/store/userStore";

const { logout } = useUserStore();

logout();
// This automatically:
// - Clears all state
// - Clears localStorage
// - Clears cookie
// - Redirects to /login
```

### Accessing User Data
```typescript
import { useUserStore } from "@/store/userStore";

export function MyComponent() {
  const { user, isAuthenticated, points, streak } = useUserStore();
  
  if (!isAuthenticated) return <div>Not logged in</div>;
  
  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <p>Points: {points}</p>
      <p>Streak: {streak}</p>
    </div>
  );
}
```

### Protecting a Page
Pages are automatically protected by the ProtectedRoute component in the root layout. No additional setup needed.

## Authentication Flow

### On App Boot
1. Root layout mounts
2. Providers component calls `loadFromStorage()`
3. `loadFromStorage()` reads token and userId from localStorage
4. If both exist, fetches fresh user profile from API
5. Sets `isAuthenticated = true` and populates store
6. ProtectedRoute checks `isAuthenticated` and allows/denies access

### On Login
1. User submits login form
2. API returns `{ token, userId, user }`
3. Call `setAuth(userId, token, user)`
4. Store persists to localStorage and cookie
5. User is redirected to dashboard
6. ProtectedRoute allows access to protected pages

### On Logout
1. User clicks logout button
2. Call `logout()`
3. Store clears all state
4. localStorage and cookie are cleared
5. User is redirected to /login
6. ProtectedRoute blocks access to protected pages

### On 401 Response
1. API returns 401 (Unauthorized)
2. Response interceptor calls `logout()`
3. Same as manual logout flow

## Storage Keys

**localStorage:**
- `authToken` - JWT token
- `userId` - User ID
- `userProfile` - Cached user profile (JSON)
- `arya_chat_{userId}` - Chat history (cleared on logout)

**Cookie:**
- `studyai_token` - JWT token (7-day expiry, SameSite=Lax)

## Type Definitions

### UserProfile
```typescript
interface UserProfile {
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
```

## Dependencies
- `zustand@^4.5.5` - State management
- `next@16.2.4` - React framework
- `axios@^1.7.9` - HTTP client
- `react-hot-toast@^2.4.1` - Toast notifications

**Removed:**
- ❌ `next-auth` - No longer needed, using pure JWT auth

## Testing Checklist

- [ ] App boots and loads auth state from localStorage
- [ ] Login sets auth state and persists to storage
- [ ] Logout clears all state and redirects to /login
- [ ] Protected pages redirect unauthenticated users to /login
- [ ] Public pages are accessible without authentication
- [ ] Navbar shows user info when authenticated
- [ ] Navbar shows login/signup buttons when not authenticated
- [ ] 401 responses trigger logout automatically
- [ ] Token is sent in Authorization header on all requests
- [ ] Chat history is cleared on logout
