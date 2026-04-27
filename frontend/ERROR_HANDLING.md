# Error Handling Guide

## 409 Conflict Error - Email Already Registered

### What Happened
When you tried to signup, you got multiple 409 errors:
```
Failed to load resource: the server responded with a status of 409 (Conflict)
```

### Why
**409 Conflict** means the email you're trying to register with already exists in the database.

The backend returns this when:
```javascript
if (err.message === "Email already registered") {
  return res.status(409).json({ success: false, error: "Email already registered" });
}
```

### Root Cause
You were either:
1. ✅ Trying to signup with an email that's already registered
2. ✅ Clicking signup multiple times (duplicate requests)
3. ✅ Using the same email repeatedly

### Solution Applied

#### 1. **Better Error Handling in API Interceptor**
```typescript
// frontend/src/lib/api.ts
if (status === 409) {
  // Conflict error (e.g., email already registered)
  const err = new Error(errorMsg || "This resource already exists");
  return Promise.reject(err);
}
```

#### 2. **Better Error Display in Signup Page**
```typescript
// frontend/app/(auth)/signup/page.tsx
} catch (err: unknown) {
  if (err instanceof Error) {
    const message = err.message;
    if (message.includes("409") || message.includes("Email already registered")) {
      setErrors({ email: "An account with this email already exists. Please log in instead." });
    } else {
      setErrors({ form: message || "Something went wrong. Please try again." });
    }
  }
}
```

Now when you get a 409, you'll see a clear message:
> "An account with this email already exists. Please log in instead."

### How to Fix

#### Option 1: Use a Different Email
```
Try: test2@example.com (instead of test@example.com)
```

#### Option 2: Login Instead
If the email is already registered, go to `/login` and use your password.

#### Option 3: Check Database
If you want to clear the database and start fresh:
```bash
# In MongoDB
db.users.deleteMany({})
```

## Common HTTP Status Codes

| Status | Meaning | What to Do |
|--------|---------|-----------|
| 200 | OK | Success ✅ |
| 201 | Created | Resource created ✅ |
| 400 | Bad Request | Check your input (missing fields, invalid format) |
| 401 | Unauthorized | Token expired or invalid - login again |
| 409 | Conflict | Email already exists - use different email or login |
| 500 | Server Error | Backend crashed - check server logs |

## Error Handling Flow

```
User submits form
    ↓
Frontend validates (client-side)
    ↓
API call to backend
    ↓
Backend validates (server-side)
    ↓
If error:
  - 400: Bad request → show field error
  - 401: Unauthorized → logout and redirect to /login
  - 409: Conflict → show "email already exists"
  - 500: Server error → show "server error" toast
    ↓
If success:
  - 201: Created → save auth state
  - 200: OK → process response
```

## Preventing Duplicate Requests

The signup page already has protection:
```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;

  setLoading(true);  // ← Disable button
  try {
    // API call
  } finally {
    setLoading(false);  // ← Re-enable button
  }
};
```

The submit button is disabled while loading, preventing double-clicks.

## Testing Error Scenarios

### Test 409 Error
1. Go to `/signup`
2. Enter an email that's already registered
3. Click "Create Account"
4. Should see: "An account with this email already exists. Please log in instead."

### Test 400 Error
1. Go to `/signup`
2. Leave email blank
3. Click "Create Account"
4. Should see: "Email is required"

### Test 401 Error
1. Login successfully
2. Manually delete the token from localStorage
3. Try to access `/dashboard`
4. Should redirect to `/login`

### Test 500 Error
1. Stop the backend server
2. Try to login
3. Should see: "Server error. Please try again."

## API Response Format

All API responses follow this format:

### Success (2xx)
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "userId": "507f1f77bcf86cd799439011",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "points": 0,
      "streak": 0
    }
  }
}
```

### Error (4xx/5xx)
```json
{
  "success": false,
  "error": "Email already registered"
}
```

## Debugging Tips

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try signup
4. Click the failed request
5. Check Response tab for error message

### Check Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check if API is being called

### Check localStorage
1. Open DevTools (F12)
2. Go to Application > Storage > localStorage
3. Check for `authToken`, `userId`, `userProfile`

### Check Backend Logs
```bash
# Terminal where backend is running
# Look for error messages like:
# "Register error: Email already registered"
```

## Summary

✅ **409 Conflict** = Email already exists
✅ **Better error messages** = Clear feedback to user
✅ **Duplicate prevention** = Button disabled while loading
✅ **Proper error handling** = Different messages for different errors

Now when you signup:
- ✅ If email exists → clear message
- ✅ If validation fails → field-specific error
- ✅ If server error → toast notification
- ✅ If success → redirect to onboarding
