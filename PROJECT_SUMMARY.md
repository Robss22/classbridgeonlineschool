# ClassBridge School — Project Summary & Roadmap

## 🎯 Project Vision

ClassBridge is an educational content management and delivery platform where:

- **Teachers** upload curriculum-aligned educational content (study notes, videos, assignments)
- **Students** access content based on their registered curriculum (Cambridge or UNEB)
- **Admins** provision users, manage access, and oversee platform operations
- **Content** is organized hierarchically: Subjects → Units → Topics → Study Materials (notes, videos)

## 📊 Current Architecture

### Backend (Node.js + Express + PostgreSQL)

**Core Modules:**

- **Authentication** (`/routes/authRoutes.js`): JWT-based signup/login for students, middleware-protected endpoints for staff
- **Admin Provisioning** (`/routes/adminRoutes.js`): User onboarding with role-based access (teacher/admin/student)
- **Resource Management** (`/routes/resourceRoutes.js`): Content browsing and YouTube video linking (notes upload TBD)
- **Performance Tracking** (`/routes/performanceRoutes.js`): Exam score recording and student report generation
- **Middleware** (`/middleware/authMiddleware.js`): JWT verification and role-based access control
- **Database** (`/config/db.js`): PostgreSQL connection via Supabase

**Key Features Implemented:**

- ✅ User signup/login with JWT tokens (24-hour expiry)
- ✅ Admin onboarding of teachers and students with curriculum assignment
- ✅ Teacher-to-multiple-curricula support (many-to-many via `teacher_curricula` join table)
- ✅ Content hierarchy: subjects → units → topics → notes/videos
- ✅ YouTube video linking for topics
- ✅ Student performance tracking (exam scores, comments)
- ✅ Role-based endpoint protection (verifyToken, requireRole middleware)

### Frontend (React + Vite)

**Core Components:**

- **Auth.jsx**: Student login/signup with curriculum selection
- **AdminProvisioning.jsx**: Admin panel for staff/student provisioning
- **WorkspaceGrid.jsx**: Curriculum content browser
- **VideoPlayerPanel.jsx**: YouTube video player
- **ChapterAccordion.jsx**: Topic hierarchy explorer
- **UserOnboardingForm.jsx**: Reusable form component (bug fixed)

**Key Features Implemented:**

- ✅ JWT-based authentication with localStorage persistence
- ✅ Centralized API client (`api.js`) with auto-token-injection interceptor
- ✅ Multi-curriculum teacher assignment UI
- ✅ Student curriculum selection at signup
- ✅ Content browsing interface
- ✅ Role-based component rendering

### Database (PostgreSQL / Supabase)

**Core Tables:**

- `users` — All user accounts (students, teachers, admins)
  - Columns: `user_id`, `username`, `email`, `password_hash`, `role`, `curriculum_id`
- `curricula` — Curriculum standards (Cambridge, UNEB)
  - Columns: `curriculum_id`, `name`, `description`
- `teacher_curricula` — Many-to-many: teachers ↔ curricula assignments
  - Columns: `teacher_id`, `curriculum_id`, `assigned_at`
- `subjects`, `units`, `topics`, `notes`, `videos` — Content hierarchy
- `student_marks` — Student exam scores and comments

## 🔧 Recent Professional Improvements

### 1. Backend Standardization

- ✅ Password column unified to `password_hash` (consistent bcrypt naming)
- ✅ Teacher onboarding now persists multi-curriculum assignments via `teacher_curricula` table
- ✅ Admin routes accept `curricula_ids` array for teacher provisioning

### 2. Frontend API Unification

- ✅ Removed hardcoded `http://localhost:5000` base URLs
- ✅ All components now use centralized `API` instance from `src/api.js`
- ✅ JWT token auto-injection via Axios interceptor
- ✅ Fixed `UserOnboardingForm.jsx` input handler bug

### 3. Database Migrations

- ✅ Migration system with automatic tracking (`applied_migrations` table)
- ✅ Three production migrations created:
  - `001_create_curricula_and_teacher_curricula.sql` — Tables for curricula and teacher assignments
  - `002_rename_password_to_password_hash.sql` — Column standardization (safe, idempotent)
  - `003_seed_curricula.sql` — Seed Cambridge (ID:1) and UNEB (ID:2)
- ✅ Migration runner script (`migrations/runMigrations.js`) with npm script
- ✅ Command: `npm run migrate` (from backend directory)

### 4. Documentation

- ✅ **backend/SETUP.md** — Database migrations, environment setup, API structure, quick start
- ✅ **frontend/SETUP.md** — Frontend architecture, API usage, auth flow, state management, testing checklist
- ✅ **This file** — High-level project overview and roadmap

## 📋 Feature Completeness Matrix

| Feature                  | Status      | Notes                                        |
| ------------------------ | ----------- | -------------------------------------------- |
| Student signup/login     | ✅ Complete | Curriculum selection included                |
| Teacher provisioning     | ✅ Complete | Multi-curriculum support added               |
| Student enrollment       | ✅ Complete | Single curriculum assignment                 |
| Content browsing         | ✅ Complete | Hierarchy: subjects → units → topics         |
| YouTube video linking    | ✅ Complete | POST endpoint for teachers/admins            |
| **Study note upload**    | ❌ TODO     | Needs file storage integration (Supabase/S3) |
| Performance tracking     | ✅ Complete | Record marks, generate reports               |
| JWT authentication       | ✅ Complete | 24-hour tokens, auto-refresh needed          |
| Role-based access        | ✅ Complete | verifyToken + requireRole middleware         |
| Multi-curriculum support | ✅ Complete | Teachers can teach multiple curricula        |
| **Responsive UI**        | 🟡 Partial  | Desktop works; mobile optimization needed    |
| **API documentation**    | 🟡 Partial  | Setup guides done; API spec doc needed       |

## 🚀 Next Priority Items

### High Priority (Blocking Feature Delivery)

1. **File Storage Integration**
   - Integrate Supabase Storage or AWS S3 for study notes/PDFs
   - Add `POST /resources/topics/:topicId/notes` endpoint with file upload
   - Frontend: Build teacher upload UI component
   - **Estimated effort**: 1–2 days

2. **Refresh Token Implementation**
   - Extend JWT strategy with refresh tokens (longer-lived)
   - Reduce token expiry from 24h to 15m (with refresh every 24h)
   - Add `POST /auth/refresh` endpoint
   - **Estimated effort**: 4–6 hours

3. **Content Management Dashboard**
   - Teacher interface to manage uploaded content (edit, delete, reorder topics)
   - Admin dashboard to view/audit platform usage
   - **Estimated effort**: 2–3 days

### Medium Priority (Quality & UX)

4. **Responsive Design**
   - Mobile-first CSS overhaul (currently desktop-only)
   - Test on iOS/Android browsers
   - **Estimated effort**: 2 days

5. **Error Handling & Validation**
   - Server-side input validation (sanitize, length limits, type checks)
   - Consistent error response format across all endpoints
   - Client-side form validation improvements
   - **Estimated effort**: 1 day

6. **Testing & QA**
   - Write integration tests for auth and admin provisioning
   - Test teacher provisioning with multi-curricula assignments
   - Edge case testing (duplicate emails, invalid token, expired tokens)
   - **Estimated effort**: 2–3 days

### Lower Priority (Nice-to-Have)

7. **API Documentation**
   - Generate API spec (OpenAPI/Swagger)
   - Interactive API explorer (Swagger UI)
   - **Estimated effort**: 1 day

8. **Internationalization (i18n)**
   - Support English, Luganda, Swahili
   - Translation files and language switcher
   - **Estimated effort**: 1–2 days

9. **Dark Mode**
   - Theme toggle (light/dark)
   - CSS variables for theming
   - **Estimated effort**: 1 day

10. **Analytics & Monitoring**
    - User engagement tracking (views, downloads)
    - Error logging (Sentry, LogRocket)
    - Performance monitoring
    - **Estimated effort**: 1–2 days

## 🔐 Security Checklist

- [x] Password hashing with bcrypt
- [x] JWT token-based authentication
- [x] Role-based access control (RBAC)
- [ ] HTTPS enforcement (production-only)
- [ ] CORS configuration for production domain
- [ ] Rate limiting on auth endpoints
- [ ] Input sanitization & SQL injection prevention
- [ ] XSS protection (Content Security Policy headers)
- [ ] Secure token storage (consider httpOnly cookies instead of localStorage)
- [ ] Password reset flow (not yet implemented)
- [ ] Audit logging (who, what, when actions)

## 📦 Environment Variables

### Backend `.env`

```env
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=your_super_secret_key_here_change_in_production
```

### Frontend

- Currently hardcoded to `http://localhost:5000/api` in `src/api.js`
- Can be made configurable via `.env` files if needed

## 🏃 Quick Start (After Setup)

### Terminal 1: Backend

```bash
cd backend
npm install
npm run migrate
npm run dev
```

### Terminal 2: Frontend

```bash
cd frontend
npm install
npm run dev
```

### Browser

- Open `http://localhost:5173`
- Login as admin (if admin already exists in DB) OR
- Create new student account → Login → Browse content

## 📞 Common Tasks

### Add a New Admin User (via SQL)

```sql
INSERT INTO users (username, email, password_hash, role, curriculum_id)
VALUES ('admin1', 'admin@school.com', '$2b$10$...', 'admin', NULL);
```

### Run Database Migrations

```bash
cd backend
npm run migrate
```

### Deploy Frontend (Static Build)

```bash
cd frontend
npm run build
# Output in frontend/dist/ — serve via nginx, Vercel, Netlify, etc.
```

### Deploy Backend

- Package with `backend/node_modules` and `.env`
- Deploy to Heroku, Railway, DigitalOcean, AWS EC2, etc.
- Ensure PostgreSQL connection string is set in production `.env`

## 📚 Useful Links & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Express.js Guide**: https://expressjs.com/
- **React Docs**: https://react.dev/
- **Vite Guide**: https://vitejs.dev/
- **JWT Best Practices**: https://tools.ietf.org/html/rfc7519
- **bcrypt npm**: https://www.npmjs.com/package/bcrypt

## 🎓 Knowledge Transfer

All setup, architecture decisions, and code changes are documented in:

- `backend/SETUP.md` — Backend, DB migrations, API endpoints
- `frontend/SETUP.md` — Frontend architecture, component structure, auth flow
- Inline code comments in routes, middleware, and components

---

**Last Updated**: 2026-06-20  
**Status**: Production-Ready (Core Features) + In Progress (File Uploads, Refresh Tokens)
