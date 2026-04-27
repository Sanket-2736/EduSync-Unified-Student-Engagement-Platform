# StudyAI Frontend Setup

## Installation

```bash
npm install
npm install clsx tailwind-merge
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with Navbar & Toaster
│   │   ├── page.tsx            # Landing page with hero & features
│   │   └── onboard/
│   │       └── page.tsx        # 5-step onboarding form
│   ├── components/
│   │   ├── Navbar.tsx          # Top navigation bar
│   │   └── ui/
│   │       ├── Button.tsx      # Reusable button component
│   │       ├── Card.tsx        # Card container
│   │       ├── Badge.tsx       # Colored pill badges
│   │       ├── Input.tsx       # Text input with label & error
│   │       ├── Slider.tsx      # Range slider
│   │       ├── ProgressBar.tsx # Animated progress bar
│   │       └── LoadingSpinner.tsx # Loading spinner
│   └── lib/
│       └── theme.ts            # Design system & cn() utility
├── app/
│   ├── globals.css             # Tailwind base styles
│   ├── layout.tsx              # (moved to src/app)
│   └── page.tsx                # (moved to src/app)
└── package.json
```

## Design System

### Color Palette
- **Primary**: `#6C63FF` (Purple) - Main brand color
- **Secondary**: `#00C9A7` (Teal) - Accent color
- **Accent**: `#FF6B6B` (Coral) - Highlights
- **Warning**: `#FFA94D` (Amber) - Warnings

### Typography
- Font: Geist (sans-serif) and Geist Mono
- Sizes: sm (12px), base (16px), lg (18px), xl (20px), 2xl (24px), etc.

### Spacing
- Uses Tailwind's default spacing scale (4px base unit)
- Padding: p-2, p-4, p-6, p-8, etc.
- Margin: m-2, m-4, m-6, m-8, etc.

## Components

### Button
```tsx
<Button variant="primary" size="md" loading={false}>
  Click me
</Button>
```
- **Variants**: primary (solid), secondary (outline), ghost
- **Sizes**: sm, md, lg
- **Props**: loading, disabled, onClick, etc.

### Card
```tsx
<Card padding="md">
  Content here
</Card>
```
- **Padding**: sm, md, lg
- White background with rounded corners and subtle shadow

### Input
```tsx
<Input
  label="Email"
  error="Invalid email"
  helperText="Enter a valid email"
  value={value}
  onChange={handleChange}
/>
```

### Slider
```tsx
<Slider
  min={0}
  max={100}
  value={value}
  onChange={setValue}
  label="Select value"
  formatValue={(v) => `${v}%`}
/>
```

### ProgressBar
```tsx
<ProgressBar percentage={75} showLabel={true} animated={true} />
```

### Badge
```tsx
<Badge variant="success">Approved</Badge>
```
- **Variants**: success (green), warning (amber), info (purple), danger (red)

### LoadingSpinner
```tsx
<LoadingSpinner size="md" />
```
- **Sizes**: sm, md, lg

## Pages

### Landing Page (`/`)
- Hero section with headline and CTAs
- Feature cards for 4 main tools
- Stats section
- All with Framer Motion animations

### Onboarding (`/onboard`)
5-step multi-step form:
1. **Personal Info**: name, email, phone, city
2. **Academic Background**: degree, GPA, GRE, IELTS, TOEFL
3. **Study Preferences**: field, countries, timeline
4. **Financial**: family income, budget, collateral
5. **Career Goals**: goal, concerns

Features:
- Progress bar at top
- Smooth slide transitions between steps
- Form validation
- POST to `/api/users/create` on completion
- Stores userId in localStorage
- Redirects to `/dashboard`

## Navbar
- Logo with graduation cap icon
- Navigation links: Home, Tools, Loan Advisor, Chat with Arya
- User stats: streak (🔥) and points (⭐)
- Mobile hamburger menu

## Styling

### Tailwind CSS
- Configured with custom colors
- Gradient backgrounds
- Responsive design (mobile-first)
- Dark mode ready

### Animations
- Framer Motion for page transitions
- Fade-in animations on scroll
- Slide transitions in forms
- Smooth hover effects

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Running the Frontend

```bash
npm run dev
```

Server runs on `http://localhost:3000`

## Key Features

✅ Responsive design (mobile, tablet, desktop)
✅ Accessible components (ARIA labels, keyboard navigation)
✅ Smooth animations with Framer Motion
✅ Toast notifications with react-hot-toast
✅ Form validation and error handling
✅ Consistent design system
✅ TypeScript for type safety
✅ Next.js 14 with App Router
✅ Tailwind CSS for styling
