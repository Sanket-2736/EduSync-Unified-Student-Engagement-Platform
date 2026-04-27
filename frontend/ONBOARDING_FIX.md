# Onboarding Flow Fix

## Problem
After signup, users were:
1. ❌ Redirected to `/onboard` (correct)
2. ❌ But form was empty (should be pre-filled)
3. ❌ Had to enter all info again
4. ❌ After submitting, profile wasn't updating
5. ❌ User state wasn't being updated

## Root Causes

### 1. **Not Using Zustand Store**
The onboarding page was using `axios` directly instead of the Zustand store:
```typescript
// ❌ OLD - Not using store
const response = await axios.post("/api/users/create", {...});
```

### 2. **Calling Wrong Endpoint**
It was calling `/api/users/create` (legacy, no password) instead of using the authenticated API:
```typescript
// ❌ OLD - Wrong endpoint
POST /api/users/create

// ✅ NEW - Correct endpoint
PUT /api/users/{userId}
```

### 3. **Not Pre-filling Form**
The form started empty instead of using existing user data:
```typescript
// ❌ OLD - Always empty
const [formData, setFormData] = useState<FormData>(initialFormData);

// ✅ NEW - Pre-filled from store
useEffect(() => {
  if (user) {
    setFormData(prev => ({
      ...prev,
      name: user.name || "",
      email: user.email || "",
      // ... etc
    }));
  }
}, [user]);
```

### 4. **Not Updating Zustand Store**
After submission, the store wasn't being updated:
```typescript
// ❌ OLD - Only saved to localStorage
saveUserId(userId);
saveProfile({...formData});

// ✅ NEW - Update Zustand store
setUser({
  _id: userId,
  ...updatedUser,
});
```

## Solution Applied

### 1. **Import Zustand Store**
```typescript
import { useUserStore } from "@/store/userStore";

const { user, userId, setUser } = useUserStore();
```

### 2. **Pre-fill Form on Mount**
```typescript
useEffect(() => {
  if (user) {
    setFormData(prev => ({
      ...prev,
      name: user.name || "",
      email: user.email || "",
      // ... all fields from user object
    }));
  }
}, [user]);
```

### 3. **Use Correct API Endpoint**
```typescript
// Use the authenticated API function
import { updateUserProfile } from "@/lib/api";

const updatedUser = await updateUserProfile(userId, {
  name: formData.name,
  phone: formData.phone,
  city: formData.city,
  profile: {
    undergradDegree: formData.undergradDegree,
    // ... all profile fields
    onboardingComplete: true,
  },
});
```

### 4. **Update Zustand Store**
```typescript
setUser({
  _id: userId,
  ...updatedUser,
});
```

## New Flow

```
User Signs Up
    ↓
Backend returns { token, userId, user }
    ↓
setAuth() saves to Zustand + localStorage + cookie
    ↓
Redirect to /onboard
    ↓
useEffect pre-fills form with user data
    ↓
User fills remaining profile info
    ↓
Submit calls updateUserProfile()
    ↓
Backend updates user profile
    ↓
setUser() updates Zustand store
    ↓
Redirect to /dashboard
    ✅ Profile is complete and saved!
```

## What Changed

| Aspect | Before | After |
|--------|--------|-------|
| **Store** | ❌ Not used | ✅ Zustand store |
| **API** | ❌ `/api/users/create` | ✅ `PUT /api/users/{userId}` |
| **Pre-fill** | ❌ Empty form | ✅ Pre-filled from store |
| **Update** | ❌ localStorage only | ✅ Zustand + localStorage |
| **Auth** | ❌ No token | ✅ Token from signup |

## Testing

### Test the Complete Flow

1. **Go to signup:**
   ```
   http://localhost:3000/signup
   ```

2. **Fill signup form:**
   ```
   Name: John Doe
   Email: john@example.com
   Password: password123
   ```

3. **Submit signup:**
   - ✅ Should redirect to `/onboard`
   - ✅ Form should be pre-filled with name and email

4. **Fill onboarding:**
   - ✅ Name and email should already be filled
   - ✅ Fill remaining fields (degree, GPA, etc.)
   - ✅ Click "Complete Onboarding"

5. **Verify:**
   - ✅ Should redirect to `/dashboard`
   - ✅ Check localStorage for `userProfile` with all fields
   - ✅ Check Zustand store has updated user data
   - ✅ Refresh page - data should persist

### Test Data Persistence

1. **After onboarding, check localStorage:**
   ```javascript
   // In browser console
   JSON.parse(localStorage.getItem('userProfile'))
   // Should show all profile fields
   ```

2. **Refresh page:**
   - ✅ Should still be on `/dashboard`
   - ✅ User data should be loaded from localStorage
   - ✅ No need to re-enter data

3. **Check Zustand store:**
   ```javascript
   // In browser console
   const state = useUserStore.getState();
   console.log(state.user);
   // Should have all profile fields
   ```

## API Endpoints Used

### Signup (Already Authenticated)
```
POST /api/auth/register
Body: { name, email, password, phone?, city?, referralCode? }
Returns: { token, userId, user }
```

### Onboarding (Update Profile)
```
PUT /api/users/{userId}
Header: Authorization: Bearer {token}
Body: { name, phone, city, profile: {...} }
Returns: { updated user object }
```

## Key Improvements

✅ **No Duplicate Data Entry** - Form pre-filled from signup
✅ **Proper State Management** - Using Zustand store
✅ **Correct API Endpoint** - Using authenticated endpoint
✅ **Data Persistence** - Saved to store + localStorage
✅ **Better UX** - Smooth flow from signup → onboarding → dashboard

## Troubleshooting

### Form is still empty after signup
- Check that signup successfully called `setAuth()`
- Check localStorage for `authToken` and `userId`
- Check Zustand store has user data

### Profile not updating after onboarding
- Check that `userId` is available
- Check API response for errors
- Check backend logs for update errors

### Data lost after page refresh
- Check localStorage for `userProfile`
- Check that `loadFromStorage()` is being called
- Check that API `/api/users/{userId}` returns full user object

## Summary

The onboarding flow is now:
1. ✅ Pre-filled with signup data
2. ✅ Uses Zustand store for state
3. ✅ Calls correct API endpoint
4. ✅ Updates store after submission
5. ✅ Data persists across page refreshes
6. ✅ No duplicate data entry needed
