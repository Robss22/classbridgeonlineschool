# ClassBridge Frontend — Setup & Architecture Guide

## Overview

The frontend is a React + Vite application built to serve three user personas:

- **Students**: Browse and consume curriculum content (subjects, units, topics, study materials)
- **Teachers**: Upload and manage educational content aligned to Cambridge/UNEB curricula
- **Admins**: Provision users, manage system access, and oversee platform operations

## Prerequisites

- Node.js 16+ and npm
- Backend API running on `http://localhost:5000` (configurable in `src/api.js`)

## Environment Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Development Server

```bash
npm run dev
```

Server typically runs on `http://localhost:5173` (Vite default).

### 3. Production Build

```bash
npm run build
npm run preview
```

## Architecture & Key Files

### API Client (`src/api.js`)

Central Axios instance for all backend communication:

```javascript
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Auto-attaches JWT token from localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

**Usage in components:**

```javascript
import API from "./api";

// No need to manually add Authorization header
const response = await API.get("/resources/subjects");
const response = await API.post("/admin/onboard-staff", payload);
```

### Core Pages/Components

#### **Auth.jsx** — Login & Student Signup

- Handles user authentication and self-registration
- Students choose curriculum (Cambridge or UNEB) at signup
- Stores JWT token and user info in localStorage
- Uses `API` instance for `/auth/login` and `/auth/signup` endpoints

**Key Features:**

- Toggle between login and signup modes
- Curriculum selection dropdown for new registrations
- Error display and loading states

#### **AdminProvisioning.jsx** — Staff & Student Enrollment

- Admin-only component for provisioning new users
- Two modes: "Staff Directory" (teachers/admins) and "Student Enrollment"
- For teachers: Multi-curriculum assignment checkbox matrix
- For students: Single curriculum selection

**Payload Examples:**

Staff (teacher with multi-curriculum):

```javascript
{
  "username": "dr_jones",
  "email": "jones@school.com",
  "password": "tempPass123",
  "role": "teacher",
  "curricula_ids": [1, 2]  // Both Cambridge and UNEB
}
```

Student (single curriculum):

```javascript
{
  "username": "bob_student",
  "email": "bob@school.com",
  "password": "studentPass",
  "curriculum_id": 1  // Cambridge only
}
```

#### **App.jsx** — Main Router

Orchestrates authentication state and component rendering:

- If not authenticated → show `Auth.jsx`
- If admin role → show `AdminProvisioning.jsx`
- If student/teacher → show `App.css` + components (WorkspaceGrid, etc.)

#### **Components Folder**

- **WorkspaceGrid.jsx** — Browse subjects and curriculum content
- **ChapterAccordion.jsx** — Expandable topic hierarchy
- **VideoPlayerPanel.jsx** — Embedded YouTube video player
- **UserOnboardingForm.jsx** — Reusable form for user input (fixed input handler)

## Recent Fixes

### 1. **UserOnboardingForm.jsx** Input Handler Bug

**Before:**

```javascript
const { name, value } = e.target.value; // ❌ Wrong
```

**After:**

```javascript
const { name, value } = e.target; // ✓ Correct
```

### 2. **Centralized API Instance**

**Before:**

```javascript
// In Auth.jsx
await axios.post("http://localhost:5000/api/auth/login", payload);
// In AdminProvisioning.jsx
const response = await axios.post(targetUrl, payload, {
  headers: { Authorization: `Bearer ${authToken}` },
});
```

**After:**

```javascript
// In Auth.jsx
import API from "./api";
await API.post("/auth/login", payload);

// In AdminProvisioning.jsx
import API from "../api";
await API.post(targetUrl, payload); // Token auto-attached by interceptor
```

**Benefits:**

- Consistent token handling across all requests
- Single source of truth for baseURL (easy to update)
- Automatic JWT refresh/error handling in one place
- Cleaner component code

## Authentication Flow

1. **Login/Signup**: User submits credentials → API validates → Returns JWT token
2. **Token Storage**: Token saved in `localStorage` under key `"token"`
3. **Auto-Attach**: API interceptor adds `Authorization: Bearer <token>` to all requests
4. **Protected Routes**: Backend middleware (`verifyToken`, `requireRole`) validates token and role
5. **Error Handling**: Invalid/expired tokens return 401/403 → Frontend clears token and redirects to Auth

## Key Endpoints Used by Frontend

### Authentication

- `POST /auth/signup` — Student self-registration
- `POST /auth/login` — Login (all roles)

### Admin

- `POST /admin/onboard-staff` — Create teacher/admin (requires `curricula_ids` array)
- `POST /admin/enroll-student` — Enroll student (requires `curriculum_id` integer)

### Resources (Content)

- `GET /resources/subjects` — List all subjects
- `GET /resources/subjects/:subjectId/units` — Get units for subject
- `GET /resources/units/:unitId/topics` — Get topics for unit
- `GET /resources/topics/:topicId/notes` — Get study materials
- `GET /resources/topics/:topicId/videos` — Get video resources

### Performance (Teacher/Admin)

- `POST /performance/record-marks` — Record student exam scores
- `GET /performance/student-report/:studentId` — Get student performance report

## State Management

Components use React's built-in `useState` for local state:

- **Auth.jsx**: `isLogin`, `email`, `password`, `curriculumId`, `error`, `loading`
- **AdminProvisioning.jsx**: `mode`, `formData`, `selectedCurricula`, `status`
- **App.jsx**: `user`, `isAuthenticated`, `loading`

For larger apps, consider Redux or Zustand for global state.

## Styling

- **CSS Modules** not currently in use; using inline styles and global `App.css`
- **Tailwind CSS** not configured; components use basic HTML/CSS

### Adding Tailwind (Optional)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Then configure `tailwind.config.js` and import Tailwind in `src/index.css`.

## Running End-to-End

### Scenario: Admin Onboards a Teacher for Both Curricula

1. **Backend ready:**

   ```bash
   cd backend
   npm install
   npm run migrate
   npm run dev
   ```

2. **Frontend ready:**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Open browser:** `http://localhost:5173`

4. **Admin login:** Use existing admin credentials

5. **Provision teacher:** Navigate to Admin Provisioning
   - Select "Staff Directory" mode
   - Fill form: username, email, password, role="teacher"
   - Check both curricula boxes (Cambridge + UNEB)
   - Click "Provision Staff Member"

6. **Verify:** Check backend logs for successful database inserts into `teacher_curricula` table

## Security Considerations

- **Token Storage**: JWT stored in `localStorage` (accessible by JavaScript). For enhanced security, use httpOnly cookies.
- **HTTPS**: In production, always use HTTPS to prevent token interception.
- **CORS**: Backend is configured with `cors()` — ensure `Access-Control-Allow-Origin` matches frontend domain in production.
- **Token Expiry**: Currently 24 hours; consider shorter expiry and implementing refresh tokens.

## Testing

### Manual Testing Checklist

- [ ] Student signup with Cambridge curriculum selection
- [ ] Student login with token persistence
- [ ] Admin login and access to provisioning forms
- [ ] Teacher provisioning with multi-curriculum assignment
- [ ] Student provisioning with single curriculum
- [ ] Fetch and display subjects/content
- [ ] Video player loads YouTube videos correctly
- [ ] Error messages display for invalid credentials
- [ ] Token expiry redirects to login

### Automated Testing (Optional)

Consider adding Jest + React Testing Library:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest @babel/preset-react
```

## Troubleshooting

### "Cannot GET /api/auth/login"

- Backend not running. Start it: `npm run dev` in `backend/`
- Check `src/api.js` baseURL matches backend server address

### Token Disappears on Page Refresh

- Normal: Token is in `localStorage`. If it's not persisting, check browser console for storage errors.
- Ensure anti-tracking/privacy settings aren't blocking localStorage.

### CORS Error

- Backend `server.js` has `app.use(cors())` — this allows requests from any origin.
- In production, configure CORS to specific domains: `cors({ origin: "https://yourdomain.com" })`

### Form Inputs Not Capturing Values

- Use `<input name="fieldName" onChange={handleInputChange} />` pattern
- Verify event handler uses `e.target` not `e.target.value`

## Next Steps

- [ ] **Content Upload UI**: Build teacher interface to upload study notes/PDFs
- [ ] **File Storage Integration**: Connect Supabase Storage or S3 for media storage
- [ ] **Performance Dashboard**: Display student scores and progress charts
- [ ] **Responsive Design**: Optimize for mobile/tablet screens
- [ ] **Dark Mode**: Add theme toggle
- [ ] **Internationalization (i18n)**: Support multiple languages (English, Luganda, etc.)
