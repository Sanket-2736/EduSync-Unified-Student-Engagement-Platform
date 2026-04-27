# Authentication Flow - Complete Guide

## YES, The App IS Using Backend Auth

✅ **Backend endpoints being used:**
- `POST /api/auth/register` - Signup with password hashing
- `POST /api/auth/login` - Login with credentials
- `PUT /api/users/{userId}` - Update profile (onboarding)
- `GET /api/users/{userId}` - Get user profile

✅ **Frontend is calling these endpoints:**
- `authRegister()` in signup page
- `authLogin()` in login page
- `updateUserProfile()` in onboarding page
- `getUserProfile()` in store

## Complete Authentication Flow

### 1. **Signup Flow**

```
User goes to /signup
    ↓
Fills form: name, email, password
    ↓
Clicks "Create Account"
    ↓
Frontend calls: POST /api/auth/register
    ↓
Backend:
  - Validates input
  - Hashes password with bcrypt
  - Creates user in MongoDB
  - Returns { token, userId, user }
    ↓
Frontend:
  - Calls setAuth(userId, token, user)
  - Saves to Zustand store
  - Saves to localStorage
  - Saves token to cookie
    ↓
Redirects to /onboard
    ↓
Form pre-filled with user data
    ↓
User fills profile info
    ↓
Clicks "Complete Onboarding"
    ↓
Frontend calls: PUT /api/users/{userId}
    ↓
Backend:
  - Validates token
  - Updates user profile in MongoDB
  - Returns updated user
    ↓
Frontend:
  - Calls setUser(updatedUser)
  - Updates Zustand store
    ↓
Redirects to /dashboard
    ✅ User is authenticated!
```

### 2. **Login Flow**

```
User goes to /login
    ↓
Fills form: email, password
    ↓
Clicks "Sign In"
    ↓
Frontend calls: POST /api/auth/login
    ↓
Backend:
  - Finds user by email
  - Compares password with bcrypt
  - Returns { token, userId, user, streak, points }
    ↓
Frontend:
  - Calls setAuth(userId, token, user)
  - Saves to Zustand store
  - Saves to localStorage
  - Saves token to cookie
    ↓
Redirects to /dashboard
    ✅ User is authenticated!
```

### 3. **App Boot Flow**

```
User opens app
    ↓
Providers component mounts
    ↓
Calls loadFromStorage()
    ↓
Checks localStorage for token and userId
    ↓
If found:
  - Calls GET /api/users/{userId}
  - Backend returns fresh user data
  - Sets isAuthenticated = true
    ↓
If not found:
  - Sets isAuthenticated = false
    ↓
ProtectedRoute checks isAuthenticated
    ↓
If public route (/login, /signup, /):
  - Allows access
    ↓
If protected route (/dashboard, /chat, etc):
  - If authenticated: allows access
  - If not authenticated: redirects to /login
```

## Why You Might Not See Navbar Buttons

### Scenario 1: Page is Loading
- The app shows a loading spinner while checking auth
- This happens on first page load
- Wait a moment for it to complete

### Scenario 2: You're Already Logged In
- If you have a valid token in localStorage
- The navbar shows user info instead of login/signup buttons
- This is correct behavior

### Scenario 3: Check Browser Console
```javascript
// Open DevTools (F12) → Console
// Check if there are errors:
console.log(localStorage.getItem('authToken'));
console.log(localStorage.getItem('userId'));
```

## Testing the Complete Flow

### Test 1: Fresh Signup
```
1. Clear browser storage:
   - DevTools → Application → Storage → Clear All
   
2. Go to http://localhost:3000/signup
   - Should see signup form
   - Navbar should show "Log In" and "Get Started" buttons
   
3. Fill form:
   - Name: John Doe
   - Email: john@example.com
   - Password: password123
   
4. Click "Create Account"
   - Should call POST /api/auth/register
   - Should redirect to /onboard
   - Form should be pre-filled
   
5. Fill onboarding:
   - Select degree, GPA, etc.
   - Click "Complete Onboarding"
   - Should call PUT /api/users/{userId}
   - Should redirect to /dashboard
   
6. Check localStorage:
   - DevTools → Application → Storage → localStorage
   - Should have: authToken, userId, userProfile
```

### Test 2: Login
```
1. Go to http://localhost:3000/login
   - Should see login form
   - Navbar should show "Log In" and "Get Started" buttons
   
2. Fill form:
   - Email: john@example.com
   - Password: password123
   
3. Click "Sign In"
   - Should call POST /api/auth/login
   - Should redirect to /dashboard
   
4. Check localStorage:
   - Should have: authToken, userId, userProfile
```

### Test 3: Page Refresh
```
1. After login, refresh page (F5)
   - Should NOT redirect to /login
   - Should stay on /dashboard
   - User data should be loaded from localStorage
```

### Test 4: Logout
```
1. Click logout button in navbar
   - Should call logout()
   - Should clear localStorage
   - Should redirect to /login
```

## API Endpoints Reference

### Register
```
POST /api/auth/register
Body: {
  name: string,
  email: string,
  password: string,
  phone?: string,
  city?: string,
  referralCode?: string
}
Response: {
  success: true,
  data: {
    token: string,
    userId: string,
    user: { _id, name, email, ... }
  }
}
```

### Login
```
POST /api/auth/login
Body: {
  email: string,
  password: string
}
Response: {
  success: true,
  data: {
    token: string,
    userId: string,
    user: { _id, name, email, ... },
    streak: number,
    points: number
  }
}
```

### Update Profile
```
PUT /api/users/{userId}
Header: Authorization: Bearer {token}
Body: {
  name?: string,
  phone?: string,
  city?: string,
  profile?: { ... }
}
Response: {
  success: true,
  data: { updated user object }
}
```

### Get User
```
GET /api/users/{userId}
Header: Authorization: Bearer {token}
Response: {
  success: true,
  data: { user object }
}
```

## Frontend State Management

### Zustand Store (`useUserStore`)
```typescript
{
  userId: string | null,
  token: string | null,
  user: UserProfile | null,
  isLoading: boolean,
  isAuthenticated: boolean,
  points: number,
  streak: number,
  
  // Actions
  setAuth(userId, token, user),
  setUser(user),
  logout(),
  loadFromStorage()
}
```

### localStorage Keys
```
authToken - JWT token
userId - User ID
userProfile - User profile (JSON)
arya_chat_{userId} - Chat history
```

### Cookie
```
studyai_token - JWT token (7-day expiry)
```

## Troubleshooting

### Issue: Navbar buttons not showing
**Solution:**
1. Check if page is still loading (wait a moment)
2. Check localStorage for authToken
3. If authToken exists, you're logged in (buttons hidden)
4. Clear storage and refresh if stuck

### Issue: Signup not working
**Solution:**
1. Check browser console for errors
2. Check Network tab for API response
3. Verify backend is running
4. Check backend logs for errors

### Issue: Login not working
**Solution:**
1. Verify email and password are correct
2. Check if user exists in database
3. Check backend logs for errors
4. Try signup instead

### Issue: Profile not updating
**Solution:**
1. Check if token is valid
2. Check if userId is correct
3. Check backend logs for errors
4. Try logging out and back in

## Summary

✅ **Yes, the app IS using backend auth**
✅ **Signup → Backend creates user with password**
✅ **Login → Backend validates credentials**
✅ **Onboarding → Backend updates profile**
✅ **All data persisted to MongoDB**
✅ **Token stored in localStorage + cookie**
✅ **State managed with Zustand**
✅ **Routes protected with ProtectedRoute**

The system is working correctly. If you don't see navbar buttons, either:
1. The page is loading (wait)
2. You're already logged in (check localStorage)
3. There's an error (check console)
