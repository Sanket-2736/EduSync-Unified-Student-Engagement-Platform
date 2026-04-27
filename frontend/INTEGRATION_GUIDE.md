# State Management Integration Guide

## Quick Start

### 1. Update Login Page
In your login page component, after successful authentication:

```typescript
import { useUserStore } from "@/store/userStore";
import { authLogin } from "@/lib/api";

export default function LoginPage() {
  const { setAuth } = useUserStore();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await authLogin({ email, password });
      // response contains: { token, userId, user, streak, points }
      setAuth(response.userId, response.token, response.user);
      // User will be redirected automatically by ProtectedRoute
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  
  return (
    // Your login form JSX
  );
}
```

### 2. Update Signup Page
In your signup page component, after successful registration:

```typescript
import { useUserStore } from "@/store/userStore";
import { authRegister } from "@/lib/api";

export default function SignupPage() {
  const { setAuth } = useUserStore();
  
  const handleSignup = async (formData: any) => {
    try {
      const response = await authRegister(formData);
      // response contains: { token, userId, user }
      setAuth(response.userId, response.token, response.user);
      // User will be redirected automatically
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };
  
  return (
    // Your signup form JSX
  );
}
```

### 3. Use Auth State in Components
In any component that needs auth data:

```typescript
"use client";

import { useUserStore } from "@/store/userStore";

export function MyComponent() {
  const { user, isAuthenticated, points, streak, logout } = useUserStore();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <p>Points: {points} ⭐</p>
      <p>Streak: {streak} 🔥</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 4. Protected Pages
The following pages are now automatically protected:
- `/dashboard`
- `/chat`
- `/loan`
- `/loan/apply`

Unauthenticated users will be redirected to `/login`.

### 5. Public Pages
These pages are accessible without authentication:
- `/`
- `/login`
- `/signup`
- `/tools/career-navigator`
- `/tools/roi-calculator`
- `/tools/admission-predictor`

## API Integration

### Automatic Token Attachment
All API requests automatically include the JWT token:

```typescript
// This request will automatically include:
// Authorization: Bearer {token}
const response = await api.get("/api/users/me");
```

### Automatic Logout on 401
If the API returns a 401 (Unauthorized), the user is automatically logged out:

```typescript
// If this returns 401, user will be logged out automatically
try {
  await api.get("/api/protected-endpoint");
} catch (error) {
  // User has been logged out and redirected to /login
}
```

## Storage Persistence

### What Gets Saved
- **localStorage:**
  - `authToken` - JWT token
  - `userId` - User ID
  - `userProfile` - Full user profile (JSON)
  - `arya_chat_{userId}` - Chat history

- **Cookie:**
  - `studyai_token` - JWT token (7-day expiry)

### What Gets Cleared on Logout
- All localStorage keys
- All `arya_chat_*` keys
- `studyai_token` cookie
- All Zustand store state

## Debugging

### Check Auth State
```typescript
import { useUserStore } from "@/store/userStore";

// In browser console:
const state = useUserStore.getState();
console.log(state);
// Output: { userId, token, user, isAuthenticated, isLoading, points, streak }
```

### Check localStorage
```javascript
// In browser console:
console.log(localStorage.getItem("authToken"));
console.log(localStorage.getItem("userId"));
console.log(JSON.parse(localStorage.getItem("userProfile")));
```

### Check Cookie
```javascript
// In browser console:
console.log(document.cookie);
// Look for: studyai_token=...
```

## Common Issues

### Issue: User is logged out after page refresh
**Solution:** This is expected behavior if the token has expired or was cleared. The app will attempt to reload from localStorage on boot.

### Issue: Token not being sent in requests
**Solution:** Check that:
1. Token is saved in localStorage with key `authToken`
2. API interceptor is properly configured
3. Check browser console for errors

### Issue: User stays logged in after logout
**Solution:** Check that:
1. localStorage is being cleared (check DevTools > Application > Storage)
2. Cookie is being cleared (check DevTools > Application > Cookies)
3. Browser cache is not interfering

### Issue: Protected page shows loading spinner forever
**Solution:** Check that:
1. API endpoint `/api/users/{userId}` is working
2. Token is valid
3. Check browser console for API errors

## Next Steps

1. **Update Login/Signup Pages** - Integrate `setAuth()` calls
2. **Test Authentication Flow** - Login, logout, page refresh
3. **Test Protected Routes** - Try accessing protected pages without auth
4. **Test API Integration** - Verify token is sent and 401 handling works
5. **Monitor Storage** - Use DevTools to verify localStorage/cookie persistence

## Support

For issues or questions:
1. Check the STATE_MANAGEMENT_SETUP.md for detailed documentation
2. Review the Zustand store implementation in `frontend/src/store/userStore.ts`
3. Check API interceptors in `frontend/src/lib/api.ts`
4. Review ProtectedRoute logic in `frontend/src/components/ProtectedRoute.tsx`
