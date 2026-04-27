# Troubleshooting Guide

## "I can't see the navbar buttons for signup/login"

### Step 1: Check if page is loading
- Open DevTools (F12)
- Go to Console tab
- Look for any error messages
- Wait 2-3 seconds for page to fully load

### Step 2: Check localStorage
```javascript
// In browser console:
localStorage.getItem('authToken')
localStorage.getItem('userId')
```

**If both are null:**
- ✅ You're not logged in (correct)
- ✅ Navbar should show "Log In" and "Get Started"
- ✅ Go to http://localhost:3000/signup

**If both have values:**
- ✅ You're logged in
- ✅ Navbar shows user info instead of login buttons
- ✅ This is correct behavior
- ✅ To logout, click the logout button

### Step 3: Clear storage and refresh
```javascript
// In browser console:
localStorage.clear()
// Then refresh page (F5)
```

### Step 4: Check if backend is running
```bash
# In terminal where backend is running:
# Should see: "Server running on port 5000"
# If not, start backend:
npm run dev
```

### Step 5: Check API connection
```javascript
// In browser console:
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'test123' })
})
.then(r => r.json())
.then(d => console.log(d))
```

If you get an error, backend is not running or API URL is wrong.

## "Signup is not working"

### Check 1: Is backend running?
```bash
# Terminal should show:
# Server running on port 5000
```

### Check 2: Is email already registered?
```javascript
// In browser console:
localStorage.clear()
// Try signup with a NEW email
```

### Check 3: Check API response
```javascript
// In browser console:
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  })
})
.then(r => r.json())
.then(d => console.log(d))
```

### Check 4: Check backend logs
Look at the terminal where backend is running for error messages.

## "Login is not working"

### Check 1: Does user exist?
```bash
# In MongoDB:
db.users.findOne({ email: 'your@email.com' })
# Should return user object
```

### Check 2: Is password correct?
- Try the exact password you used during signup
- Passwords are case-sensitive

### Check 3: Check API response
```javascript
// In browser console:
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'your@email.com',
    password: 'your-password'
  })
})
.then(r => r.json())
.then(d => console.log(d))
```

## "Profile is not updating after onboarding"

### Check 1: Is userId available?
```javascript
// In browser console:
localStorage.getItem('userId')
// Should return a user ID like: 507f1f77bcf86cd799439011
```

### Check 2: Is token valid?
```javascript
// In browser console:
localStorage.getItem('authToken')
// Should return a long JWT token
```

### Check 3: Check API response
```javascript
// In browser console:
const userId = localStorage.getItem('userId');
const token = localStorage.getItem('authToken');

fetch(`http://localhost:5000/api/users/${userId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Updated Name',
    profile: { gpa: 3.8 }
  })
})
.then(r => r.json())
.then(d => console.log(d))
```

## "Data is lost after page refresh"

### Check 1: Is localStorage working?
```javascript
// In browser console:
localStorage.setItem('test', 'value')
localStorage.getItem('test')
// Should return: 'value'
```

### Check 2: Check what's in localStorage
```javascript
// In browser console:
console.log(localStorage)
// Should show: authToken, userId, userProfile
```

### Check 3: Check if API is returning data
```javascript
// In browser console:
const userId = localStorage.getItem('userId');
const token = localStorage.getItem('authToken');

fetch(`http://localhost:5000/api/users/${userId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log(d))
```

## "Getting 401 Unauthorized errors"

### Cause: Token is expired or invalid

### Solution:
1. Clear localStorage
2. Login again
3. New token will be generated

```javascript
// In browser console:
localStorage.clear()
// Then go to /login and login again
```

## "Getting 409 Conflict errors"

### Cause: Email already registered

### Solution:
1. Use a different email
2. Or login with existing email

```javascript
// Try signup with different email:
// test2@example.com (instead of test@example.com)
```

## "Getting 500 Server errors"

### Cause: Backend error

### Solution:
1. Check backend terminal for error messages
2. Restart backend
3. Check MongoDB connection

```bash
# Restart backend:
npm run dev
```

## Quick Checklist

- [ ] Backend is running (`npm run dev` in backend folder)
- [ ] Frontend is running (`npm run dev` in frontend folder)
- [ ] MongoDB is running
- [ ] NEXT_PUBLIC_API_URL is set to http://localhost:5000
- [ ] Browser console has no errors
- [ ] localStorage is not full
- [ ] Using a new email for signup (not already registered)
- [ ] Password is at least 8 characters

## Still Not Working?

1. **Check browser console** (F12 → Console)
2. **Check backend logs** (terminal where backend is running)
3. **Check Network tab** (F12 → Network → try signup/login)
4. **Clear everything and restart:**
   ```bash
   # Frontend
   localStorage.clear()
   # Refresh page
   
   # Backend
   # Stop (Ctrl+C) and restart (npm run dev)
   ```

## Contact

If still stuck:
1. Check the error message in console
2. Check backend logs
3. Verify all services are running
4. Try the API directly with curl or Postman
