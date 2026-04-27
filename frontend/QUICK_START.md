# Quick Start Guide - JWT Auth + Zustand

## What You Have Now

✅ **JWT Authentication** - Token-based auth with your backend
✅ **Zustand Store** - Global state management (`useUserStore`)
✅ **Route Protection** - Automatic protection for authenticated pages
✅ **Token Persistence** - localStorage + cookie
✅ **Auto Logout** - On 401 responses
✅ **No NextAuth** - Pure JWT implementation

## Core Files

### 1. **Zustand Store** (`frontend/src/store/userStore.ts`)
```typescript
import { useUserStore } from "@/store/userStore";

// In any component:
const { user, isAuthenticated, points, streak, logout } = useUserStore();
```

### 2. **API Functions** (`frontend/src/lib/api.ts`)
```typescript
import { authLogin, authRegister } from "@/lib/api";

// Login
const response = await authLogin({ email, password });

// Signup
const response = await authRegister({ name, email, password });
```

### 3. **Protected Routes** (Automatic)
These pages require authentication:
- `/dashboard`
- `/chat`
- `/loan`
- `/loan/apply`

These pages are public:
- `/`
- `/login`
- `/signup`
- `/tools/*`

## Login Flow

```typescript
import { useUserStore } from "@/store/userStore";
import { authLogin } from "@/lib/api";

export function LoginPage() {
  const { setAuth } = useUserStore();
  
  const handleLogin = async (email: string, password: string) => {
    const response = await authLogin({ email, password });
    
    // This saves to state, localStorage, and cookie
    setAuth(response.userId, response.token, {
      _id: response.userId,
      ...response.user,
    });
    
    // User is now authenticated
    // ProtectedRoute will allow access to protected pages
  };
}
```

## Signup Flow

```typescript
import { useUserStore } from "@/store/userStore";
import { authRegister } from "@/lib/api";

export function SignupPage() {
  const { setAuth } = useUserStore();
  
  const handleSignup = async (formData: any) => {
    const response = await authRegister(formData);
    
    // This saves to state, localStorage, and cookie
    setAuth(response.userId, response.token, {
      _id: response.userId,
      ...response.user,
    });
    
    // User is now authenticated
  };
}
```

## Using Auth State

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

## API Requests

All requests automatically include the JWT token:

```typescript
import api from "@/lib/api";

// Token is automatically attached
const response = await api.get("/api/protected-endpoint");

// On 401: automatically logs out user
```

## Storage

### localStorage
- `authToken` - JWT token
- `userId` - User ID
- `userProfile` - User profile (JSON)
- `arya_chat_{userId}` - Chat history

### Cookie
- `studyai_token` - JWT token (7-day expiry)

## Logout

```typescript
import { useUserStore } from "@/store/userStore";

const { logout } = useUserStore();

logout(); // Clears everything and redirects to /login
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

That's it! No NextAuth needed.

## Testing

1. Start dev server: `npm run dev`
2. Go to `/login` or `/signup`
3. Login/signup with your backend credentials
4. Check localStorage for `authToken`, `userId`, `userProfile`
5. Check cookie for `studyai_token`
6. Navigate to protected page (e.g., `/dashboard`)
7. Should work! 🎉

## Common Tasks

### Check if user is logged in
```typescript
const { isAuthenticated } = useUserStore();
if (isAuthenticated) { /* ... */ }
```

### Get user data
```typescript
const { user } = useUserStore();
console.log(user?.name, user?.email);
```

### Update user data
```typescript
const { setUser } = useUserStore();
setUser({ ...user, name: "New Name" });
```

### Handle logout
```typescript
const { logout } = useUserStore();
logout(); // Clears auth and redirects to /login
```

### Make authenticated API call
```typescript
import api from "@/lib/api";

const data = await api.get("/api/users/me");
// Token is automatically included
```

## Troubleshooting

### User logged out after page refresh
- Check localStorage for `authToken` and `userId`
- Check if token is expired
- Check backend `/api/users/{userId}` endpoint

### Token not being sent
- Check localStorage has `authToken`
- Check API interceptor in `frontend/src/lib/api.ts`
- Check browser console for errors

### Protected page shows loading forever
- Check backend `/api/users/{userId}` endpoint
- Check token is valid
- Check browser console for API errors

### Logout not working
- Check localStorage is being cleared
- Check cookie is being cleared
- Check browser DevTools > Application > Storage

## Next Steps

1. ✅ Test login/signup
2. ✅ Test protected routes
3. ✅ Test logout
4. ✅ Test API requests
5. ✅ Add Google OAuth (optional)
6. ✅ Add password reset (optional)

## Support

See detailed docs:
- `STATE_MANAGEMENT_SETUP.md` - Full documentation
- `INTEGRATION_GUIDE.md` - Integration examples
- `NEXTAUTH_REMOVAL.md` - What changed
