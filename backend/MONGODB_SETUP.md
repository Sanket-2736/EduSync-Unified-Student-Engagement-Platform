# MongoDB Setup for StudyAI

## Installation

```bash
npm install mongoose uuid
```

## Environment Configuration

Add to `.env`:

```
MONGODB_URI=mongodb://localhost:27017/studyai
```

Or for MongoDB Atlas:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studyai
```

## Database Structure

### Collections

#### 1. **users**
- `_id`: UUID v4 string (custom)
- `name`: String (required)
- `email`: String (required, unique, lowercase)
- `phone`: String
- `city`: String
- `points`: Number (default: 0)
- `streak`: Number (default: 0)
- `lastLogin`: Date
- `badges`: Array of strings
- `profile`: Object with nested fields:
  - `undergradDegree`, `gpa`, `greScore`, `ieltsScore`, `toeflScore`
  - `targetField`, `preferredCountries`, `studyTimeline`
  - `familyIncome`, `educationBudget`, `hasCollateral`
  - `careerGoal`, `biggestConcerns`, `workExperience`
- `createdAt`: Date
- `updatedAt`: Date

#### 2. **chatmessages**
- `_id`: ObjectId (auto)
- `userId`: String (ref: User, indexed)
- `sessionId`: String (indexed)
- `role`: String (enum: user, assistant, system)
- `content`: String
- `createdAt`: Date
- **Compound Index**: `{ userId: 1, sessionId: 1, createdAt: 1 }`

#### 3. **assessments**
- `_id`: ObjectId (auto)
- `userId`: String (ref: User, indexed)
- `type`: String (enum: career, roi, admission, loan)
- `input`: Mixed (raw form inputs)
- `result`: Mixed (AI response JSON)
- `createdAt`: Date

#### 4. **loanapplications**
- `_id`: ObjectId (auto)
- `userId`: String (ref: User, indexed)
- `status`: String (enum: draft, submitted, under_review, approved, rejected)
- `loanAmount`: Number
- `university`: String
- `course`: String
- `country`: String
- `selectedLender`: String
- `eligibilityResult`: Mixed
- `repaymentPlan`: Mixed
- `documents`: Array of objects with `name`, `status`, `uploadedAt`
- `createdAt`: Date
- `updatedAt`: Date

## Repositories

### userRepository.js
- `createUser(profileData)` - Create new user
- `getUserById(id)` - Fetch user by ID
- `getUserByEmail(email)` - Fetch user by email
- `updateUser(id, updates)` - Update user fields
- `updateStreak(id)` - Update login streak and points
- `addBadge(id, badge)` - Add badge (no duplicates)
- `addPoints(id, points)` - Increment user points

### chatRepository.js
- `saveChatMessage(userId, role, content, sessionId)` - Save message
- `getChatHistory(userId, sessionId, limit)` - Get chat history
- `deleteSessionHistory(userId, sessionId)` - Delete session

### assessmentRepository.js
- `saveAssessment(userId, type, input, result)` - Save assessment
- `getAssessmentsByUser(userId, type)` - Get user assessments

## Authentication

The `authMiddleware` in `src/middleware/auth.js`:
- Reads `x-user-id` header
- Skips auth for `POST /api/users/create`
- Attaches user to `req.user`
- Returns 401 if user not found

## Usage Example

```javascript
// Create user
const user = await createUser({
  name: "Arjun Sharma",
  email: "arjun@example.com",
  phone: "+91-9876543210",
  city: "Bangalore",
  profile: {
    gpa: 3.8,
    greScore: 330,
    targetField: "Computer Science",
    preferredCountries: ["USA", "Canada"],
    educationBudget: 50000,
  },
});

// Get user
const user = await getUserById(user.id);

// Update profile
await updateUser(user.id, {
  profile: {
    ...user.profile,
    greScore: 335,
  },
});

// Login
const { streak, points, pointsEarned } = await updateStreak(user.id);

// Save assessment
await saveAssessment(user.id, "career", inputData, aiResponse);
```

## Running the Server

```bash
npm run dev:backend
```

The server will:
1. Connect to MongoDB
2. Log "MongoDB connected: {host}"
3. Start Express on port 5000
