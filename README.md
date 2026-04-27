# StudyAI — AI-Powered Study Abroad Platform for Indian Students

> An end-to-end platform that guides Indian students through every stage of studying abroad — from university selection and admission prediction to education loans and visa guidance — powered by Cerebras LLM, a deterministic scoring engine, and a streaming AI mentor.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
  - [1. Authentication & Onboarding](#1-authentication--onboarding)
  - [2. AI Career Navigator](#2-ai-career-navigator)
  - [3. Arya — Streaming AI Mentor](#3-arya--streaming-ai-mentor)
  - [4. Loan Eligibility Estimator](#4-loan-eligibility-estimator)
  - [5. ROI Calculator](#5-roi-calculator)
  - [6. Admission Predictor](#6-admission-predictor)
  - [7. Application Strength Scoring Engine](#7-application-strength-scoring-engine)
  - [8. Loan Risk Engine](#8-loan-risk-engine)
  - [9. User Dashboard](#9-user-dashboard)
  - [10. Gamification System](#10-gamification-system)
  - [11. Profile-Aware AI Across Every Tool](#11-profile-aware-ai-across-every-tool)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Resume Entry](#resume-entry)

---

## Overview

StudyAI solves a real problem: Indian students planning to study abroad face fragmented, generic advice from multiple sources. StudyAI consolidates everything into one platform:

- **University recommendations** personalised to GRE, GPA, budget, and target countries
- **Admission chance prediction** with actionable improvement tips
- **Education loan eligibility** with lender comparison and EMI planning
- **ROI calculation** comparing abroad vs. staying in India
- **Arya** — a streaming AI mentor who already knows the student's profile from day one
- **Deterministic scoring engine** that produces an Application Strength Score and Loan Risk Score — no LLM guessing, pure math

The core architectural principle: **the LLM explains and converses; the system decides and calculates.**

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework with SSR/SSG |
| TypeScript | Type safety across all components |
| Tailwind CSS v4 | Utility-first styling |
| Zustand | Global state management (auth, user profile) |
| Framer Motion | Animations and transitions |
| Recharts | Data visualisation (bar charts, line charts, area charts) |
| Axios | HTTP client with JWT interceptors |
| React Hot Toast | Toast notifications |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database with structured user profiles |
| JWT (jsonwebtoken) | Stateless authentication |
| bcryptjs | Password hashing |
| Cerebras AI API | LLM inference (llama3.1-8b) |
| Server-Sent Events (SSE) | Real-time streaming chat |
| express-rate-limit | API rate limiting |
| helmet | HTTP security headers |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerised deployment |
| MongoDB Atlas | Cloud database |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│                                                             │
│  Zustand Store ──► All tools read profile from store        │
│  JWT Interceptor ──► Every API request authenticated        │
│  ProtectedRoute ──► Route-level auth guard                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / JWT
┌──────────────────────────▼──────────────────────────────────┐
│                     Backend (Express)                        │
│                                                             │
│  Auth Middleware ──► Validates JWT on every protected route │
│                                                             │
│  Scoring Engine ──► Pure math, zero LLM                     │
│       ↓                                                     │
│  Cerebras LLM ──► Explains scores, never produces them      │
│                                                             │
│  SSE Streaming ──► Real-time chat token delivery            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    MongoDB Atlas                             │
│  Users · Assessments · ChatMessages · LoanApplications      │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

### 1. Authentication & Onboarding

**Implementation:**
- `POST /api/auth/register` — bcrypt password hashing (cost factor 10), generates JWT (7-day expiry), awards "First Step" badge
- `POST /api/auth/login` — validates credentials, updates login streak, returns token + streak + points
- JWT stored in both `localStorage` and a `SameSite=Lax` cookie so Next.js middleware can read it server-side
- Zustand `userStore` hydrates on app boot by calling `GET /api/users/{userId}` — falls back to cached localStorage profile if API is unavailable
- 5-step onboarding form collects: personal info → academics (GPA, GRE, IELTS) → study preferences (field, countries, timeline) → finances (budget, family income, collateral) → career goals
- Profile stored in nested MongoDB schema: `profile.academics`, `profile.preferences`, `profile.finances`, `profile.goals`
- `onboardingComplete` flag set at top level on submission

**Key files:**
- `backend/src/routes/auth.js` — register, login, verify endpoints
- `frontend/src/store/userStore.ts` — Zustand store with setAuth, logout, loadFromStorage
- `frontend/app/onboard/page.tsx` — 5-step animated form with progress bar

---

### 2. AI Career Navigator

**Implementation:**
- User inputs: GRE score, GPA, annual budget, field of study, work experience, preferred countries
- Form pre-filled from Zustand store (no re-entry of data)
- Custom searchable dropdown for 25 fields of study; custom multi-select with pill tags for 15 countries
- `POST /api/career-navigator` sends structured prompt to Cerebras `llama3.1-8b`
- LLM returns structured JSON: `topCountries[]`, `topUniversities[]`, `recommendedCourses[]`, `personalizedMessage`
- `chatJSON()` method strips markdown fences, retries once with lower temperature if JSON parse fails
- Results displayed as: country cards with visa difficulty badges, university table, bar chart (Recharts), course pills
- Chart labels use `shortName()` function with known abbreviations (MIT, CMU, NUS, etc.) to prevent clipping
- Results saved to MongoDB `assessments` collection; user awarded +25 points and "Career Explorer" badge

**Key files:**
- `backend/src/routes/careerNavigator.js`
- `backend/src/services/cerebras.js` — `chatJSON()` with retry logic
- `frontend/app/tools/career-navigator/page.tsx`

---

### 3. Arya — Streaming AI Mentor

**Implementation:**
- Real-time streaming via Server-Sent Events (SSE) — tokens stream to the browser as they are generated
- On first visit (no chat history), `generateGreeting()` fires automatically — calls the same `/api/mentor/chat` endpoint with a prompt that forces Arya to reference the student's actual profile data (name, field, GRE, countries, career goal)
- System prompt pre-loaded with full student profile on every message — Arya never asks "what's your GRE score?" because she already knows
- Profile-aware quick-prompt chips generated dynamically: "Is my GRE score of 320 competitive?" instead of generic prompts
- Chat history persisted to both localStorage (per-user key `arya_chat_{userId}`) and MongoDB `ChatMessage` collection
- Markdown rendering in chat bubbles: `**bold**`, `*italic*`, `` `code` ``, `# headers`, `- bullet lists`, `1. numbered lists` — no external library, pure regex parser
- Backend saves both user message and completed assistant response to MongoDB after each exchange
- User awarded +5 points and "First Chat" badge per conversation

**Key files:**
- `backend/src/routes/mentor.js` — SSE streaming with MongoDB persistence
- `frontend/src/hooks/useChat.ts` — streaming hook with `generateGreeting()`
- `frontend/app/chat/page.tsx` — full chat UI with markdown renderer

---

### 4. Loan Eligibility Estimator

**Implementation:**
- 3-step wizard: Eligibility Check → Lender Comparison → Repayment Planner
- Step 1 inputs: course, university, country, loan amount, family income, co-applicant income, CIBIL score, collateral toggle
- Form pre-filled from profile (target field → course, family income, collateral, education budget)
- `POST /api/loan/eligibility` sends to Cerebras; returns: `eligibleAmount`, `estimatedInterestRate`, `emiEstimate`, `approvalChance`, `topLenders[]`, `requiredDocuments[]`, `tips[]`
- Step 2 shows lender cards with pros/cons, interactive document checklist with progress counter
- Step 3 repayment planner: 3 EMI scenarios (Standard, Accelerated, Income-Based) + area chart of outstanding balance over 24 months
- Loan applications stored in MongoDB `LoanApplication` collection with document status tracking (pending → uploaded → verified)
- Results saved to assessments; user awarded +25 points and "Loan Ready" badge

**Key files:**
- `backend/src/routes/loanAdvisor.js`
- `backend/src/routes/loanDocuments.js`
- `frontend/app/loan/page.tsx`
- `frontend/app/loan/apply/page.tsx`

---

### 5. ROI Calculator

**Implementation:**
- Inputs: university, course, country, field of study, loan amount
- Pre-filled from profile (field, preferred country, education budget)
- `POST /api/roi-calculator` returns: `avgSalaryYear1`, `avgSalaryYear5`, `loanPayoffYears`, `netROI5yr`, `netROI10yr`, `verdict`, `salaryGrowthCurve[]`
- Dual-line chart comparing abroad salary vs. estimated India salary (using hardcoded field-based India salary benchmarks)
- Salary premium percentage calculated client-side
- Results saved to assessments; user awarded +25 points and "ROI Explorer" badge

**Key files:**
- `backend/src/routes/roiCalculator.js`
- `frontend/app/tools/roi-calculator/page.tsx`

---

### 6. Admission Predictor

**Implementation:**
- Inputs: target university, program, GRE, GMAT, GPA, work experience, publications, extra-curriculars, SOP
- Pre-filled from profile (GRE, GPA, work experience, course auto-filled as "MS {targetField}")
- `POST /api/admission-predictor` returns: `admissionChance` (0–100), `profileStrength`, `strengths[]`, `weaknesses[]`, `improvementTips[]`, `similarProfiles[]`
- Animated circular SVG progress ring showing admission percentage
- "Improve my SOP with Arya" button deep-links to chat with pre-filled SOP context via `?message=` query param
- Results saved to assessments; user awarded +25 points and "Dream Chaser" badge

**Key files:**
- `backend/src/routes/admissionPredictor.js`
- `frontend/app/tools/admission-predictor/page.tsx`

---

### 7. Application Strength Scoring Engine

**Implementation — pure deterministic math, zero LLM:**

```
Overall Score = Academics(25%) + TestScores(25%) + Experience(15%) + Financial(20%) + Completeness(15%)
```

| Sub-score | Calculation |
|---|---|
| Academics | GPA tiers (8.5+=70pts) + degree presence (30pts) |
| Test Scores | GRE tiers (330+=80pts) + IELTS/TOEFL bonus (20pts) |
| Experience | Work years: 0=20, 1=40, 2=55, 3=70, 4=80, 5+=100 |
| Financial | Budget adequacy + family income tier + collateral bonus |
| Completeness | 10 key profile fields checked, % filled |

- Tier labels: Strong (80+), Good (60+), Average (40+), Needs Work (<40)
- LLM called **after** scoring to explain the weakest sub-scores in 4 sentences — it never produces the score
- Dashboard shows animated circular dial + 5 sub-score progress bars with colour coding

**Key files:**
- `backend/src/services/scoringEngine.js` — `computeApplicationScore()`
- `backend/src/routes/scores.js` — `POST /api/scores/application`
- `frontend/src/components/ApplicationScoreCard.tsx`

---

### 8. Loan Risk Engine

**Implementation — pure deterministic math, zero LLM:**

Key metric: **Loan-to-first-year-salary ratio** (safe threshold: 2x)

```
Risk Score = loanToSalaryRisk + emiBurdenRisk + familyIncomePenalty
           - collateralBonus - academicStrengthBonus - workRightsBonus
```

- Country salary data hardcoded: USA ($85k, OPT 3yr), Canada ($55k, PGWP 3yr), UK ($45k, PSW 2yr), etc.
- Field salary multiplier: CS/AI/Data = 1.15x, Finance/MBA = 1.05x, Law = 0.85x, Design = 0.75x
- EMI calculated using standard amortisation formula (10% p.a., 10-year tenure)
- Proactive warnings generated when ratio > 2x or EMI > 30% of salary
- Example warning: *"Your loan-to-first-year-salary ratio is 4.2x. The safe threshold is 2x."*
- LLM called after risk calculation to explain in plain English — never to produce the risk score

**Key files:**
- `backend/src/services/scoringEngine.js` — `computeLoanRisk()`
- `backend/src/routes/scores.js` — `POST /api/scores/loan-risk`
- `frontend/src/components/LoanRiskCard.tsx`

---

### 9. User Dashboard

**Implementation:**
- Personalised greeting with name and streak message
- Application Strength Score card (animated dial + sub-scores)
- Loan Risk Score card (risk meter + warnings + key metrics)
- Quick-access cards to all 4 AI tools
- Past assessments list with one-liner summaries, clickable to open ResultsModal
- ResultsModal renders full results with charts for each assessment type
- Daily challenge rotates through tools, awards +50 points on completion
- Tip of the day rotates from 10 study-abroad tips
- Referral section with copyable link
- Profile incomplete banner with CTA to onboarding

**Key files:**
- `frontend/app/dashboard/page.tsx`
- `frontend/src/components/ResultsModal.tsx`
- `frontend/src/components/ApplicationScoreCard.tsx`
- `frontend/src/components/LoanRiskCard.tsx`

---

### 10. Gamification System

**Implementation:**
- Points awarded per action: login (+10), career navigator (+25), loan check (+25), chat message (+5), daily challenge (+50), profile complete (+50)
- Streak tracking: consecutive daily logins increment streak; missed day resets to 1
- 8 badges: First Step, First Chat, ROI Explorer, Dream Chaser, Loan Ready, Week Warrior, Profile Complete, Navigator
- Level system: Explorer (0–499), Pathfinder (500–1999), Scholar (2000–4999), Ambassador (5000+)
- Animated points counter (ease-out cubic animation)
- 7-day login heatmap in StreakCard
- Badge grid with locked/unlocked states and hover tooltips

**Key files:**
- `frontend/src/components/gamification/PointsDisplay.tsx`
- `frontend/src/components/gamification/StreakCard.tsx`
- `frontend/src/components/gamification/BadgeCollection.tsx`
- `backend/src/db/userRepository.js` — `addPoints()`, `addBadge()`, `updateStreak()`

---

### 11. Profile-Aware AI Across Every Tool

**Implementation:**
- Single `useProfile()` hook reads from Zustand store (nested schema) and returns flat tool-ready object
- Every tool imports `useProfile()` — no tool reads `localStorage` directly
- Pre-fill runs in `useEffect` on profile load — user never re-enters GRE, GPA, countries, budget
- Career Navigator: pre-fills GRE, GPA, budget, field, countries
- ROI Calculator: pre-fills field, country, loan amount
- Admission Predictor: pre-fills GRE, GPA, work experience, course
- Loan Estimator: pre-fills target field, family income, collateral, budget
- Arya: full profile injected into system prompt on every message — name, field, GRE, GPA, countries, timeline, budget, career goal, concerns

**Key files:**
- `frontend/src/hooks/useProfile.ts`
- `frontend/src/store/userStore.ts`

---

## Project Structure

```
study-ai/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── assessmentRepository.js
│   │   │   ├── chatRepository.js
│   │   │   ├── userRepository.js
│   │   │   └── index.js
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT validation middleware
│   │   ├── models/
│   │   │   ├── User.js              # Nested profile schema
│   │   │   ├── Assessment.js
│   │   │   ├── ChatMessage.js
│   │   │   └── LoanApplication.js
│   │   ├── routes/
│   │   │   ├── auth.js              # register, login, verify
│   │   │   ├── users.js             # CRUD + streak
│   │   │   ├── careerNavigator.js
│   │   │   ├── roiCalculator.js
│   │   │   ├── admissionPredictor.js
│   │   │   ├── loanAdvisor.js
│   │   │   ├── loanDocuments.js
│   │   │   ├── mentor.js            # SSE streaming chat
│   │   │   ├── assessments.js
│   │   │   └── scores.js            # Scoring engine endpoints
│   │   ├── services/
│   │   │   ├── cerebras.js          # LLM client with retry logic
│   │   │   ├── scoringEngine.js     # Deterministic scoring (no LLM)
│   │   │   └── index.js
│   │   └── index.js                 # Express app entry point
│   ├── .env
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx               # Root layout with Navbar + Providers
│   │   ├── page.tsx                 # Landing page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── onboard/page.tsx
│   │   ├── chat/page.tsx
│   │   ├── loan/
│   │   │   ├── page.tsx
│   │   │   └── apply/page.tsx
│   │   └── tools/
│   │       ├── career-navigator/page.tsx
│   │       ├── roi-calculator/page.tsx
│   │       └── admission-predictor/page.tsx
│   ├── src/
│   │   ├── components/
│   │   │   ├── ApplicationScoreCard.tsx
│   │   │   ├── LoanRiskCard.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── Providers.tsx
│   │   │   ├── ResultsModal.tsx
│   │   │   ├── gamification/
│   │   │   │   ├── BadgeCollection.tsx
│   │   │   │   ├── PointsDisplay.tsx
│   │   │   │   └── StreakCard.tsx
│   │   │   └── ui/
│   │   │       ├── Button.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Slider.tsx
│   │   │       ├── Badge.tsx
│   │   │       ├── ProgressBar.tsx
│   │   │       └── LoadingSpinner.tsx
│   │   ├── hooks/
│   │   │   ├── useChat.ts           # SSE streaming + greeting generation
│   │   │   └── useProfile.ts        # Flat profile from Zustand store
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios instance + all API functions
│   │   │   ├── storage.ts           # localStorage helpers
│   │   │   └── theme.ts
│   │   └── store/
│   │       └── userStore.ts         # Zustand auth store
│   ├── .env
│   ├── package.json
│   ├── next.config.ts
│   └── Dockerfile
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cerebras AI API key (free tier available at [cerebras.ai](https://cerebras.ai))

### Backend

```bash
cd backend
cp .env.example .env
# Fill in MONGODB_URI, CEREBRAS_API_KEY, JWT_SECRET
npm install
npm run dev
# Server runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Set NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev
# App runs on http://localhost:3000
```

### Docker (Full Stack)

```bash
docker-compose up --build
```

---

## Environment Variables

### Backend `.env`
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
CEREBRAS_API_KEY=csk-...
CEREBRAS_BASE_URL=https://api.cerebras.ai/v1
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Resume Entry

```
StudyAI – AI-Powered Study Abroad Platform | Next.js, Node.js, MongoDB, Cerebras AI, Zustand  2025

– Built a full-stack platform for Indian students planning higher education abroad, featuring 5 AI-powered
  tools: Career Navigator, Admission Predictor, ROI Calculator, Loan Eligibility Estimator, and a
  streaming AI mentor (Arya) — all pre-loaded with the student's profile from onboarding.

– Engineered a deterministic Application Strength Scoring Engine (0–100) with 5 weighted sub-scores
  (academics, test scores, experience, financial readiness, profile completeness) and a Loan Risk Engine
  that flags dangerous loan-to-salary ratios — the LLM explains scores, never produces them.

– Implemented real-time streaming chat (SSE) with Cerebras llama3.1-8b; Arya generates a personalised
  opening message referencing the student's actual GRE, GPA, target countries, and career goals on first
  visit — no other platform does this end-to-end.

– Architected JWT authentication with Zustand global state, profile-aware pre-fill across all tools
  (zero re-entry of data), MongoDB persistence for assessments and chat history, and a gamification
  system with points, streaks, badges, and daily challenges.

– Role: Full Stack Developer
```

---

## Comparison with Existing Platforms

| Feature | StudyAI | Yocket | Shiksha | Leverage Edu |
|---|---|---|---|---|
| Profile-aware AI tools | ✅ | ❌ | ❌ | ❌ |
| Streaming AI mentor | ✅ | ❌ | ❌ | Partial |
| Deterministic scoring engine | ✅ | ❌ | ❌ | ❌ |
| Loan risk flagging | ✅ | ❌ | ❌ | ❌ |
| No re-entry of data across tools | ✅ | ❌ | ❌ | ❌ |
| Personalised opening message | ✅ | ❌ | ❌ | ❌ |
| Open source / self-hostable | ✅ | ❌ | ❌ | ❌ |

---

## Also Built By the Same Developer

**DeepSecure – Deepfake Detection & Secure Browsing** | Flask, TensorFlow, Docker, SocketIO &nbsp; `2025`

– Built a CNN-based deepfake detection system with real-time inference, confidence scoring, and detection history tracking.  
– Engineered Dockerized sandbox environments for secure URL analysis, ensuring isolation and threat mitigation.  
– Developed admin dashboard with real-time analytics, JWT authentication, and WebSocket-based monitoring.  
– Role: Frontend Developer &nbsp; · &nbsp; GitHub: [github.com/Sanket-2736/DeepSecure](https://github.com/Sanket-2736/DeepSecure)

---

*Built for the Indian student community. Powered by Cerebras AI.*
