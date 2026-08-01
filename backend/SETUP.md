# ClassBridge Backend — Setup & Migration Guide

## Overview

This guide covers database schema migrations, environment setup, and running the backend server.

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL database (or Supabase PostgreSQL)
- `.env` file with required environment variables (see `.env.example` if available)

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@hostname:5432/database_name
JWT_SECRET=your_secret_key_here
```

**For Supabase:** Copy the connection string from your Supabase project settings → Database → Connection string (PostgreSQL).

## Database Migrations

The application uses a file-based migration system. Migrations are stored in `backend/migrations/` and are tracked in the `applied_migrations` table.

### Available Migrations

1. **001_create_curricula_and_teacher_curricula.sql**
   - Creates `curricula` table (lookup for Cambridge/UNEB)
   - Creates `teacher_curricula` join table for many-to-many teacher↔curriculum relations

2. **002_rename_password_to_password_hash.sql**
   - Renames `password` column to `password_hash` for consistency with bcrypt hashing
   - Safe: uses conditional logic to skip if column already renamed

3. **003_seed_curricula.sql**
   - Seeds the two core curricula:
     - Cambridge Assessment International Education (ID: 1)
     - UNEB (Uganda National Examinations Board) (ID: 2)

### Running Migrations

#### Automatic (Recommended)

```bash
# From backend/ directory
npm run migrate
```

This will:

1. Create the `applied_migrations` table if it doesn't exist
2. Run all pending migrations in lexicographic order
3. Track each applied migration to prevent re-running

#### Manual (SQL)

If you prefer to run migrations directly via psql:

```bash
psql "$DATABASE_URL" -f migrations/001_create_curricula_and_teacher_curricula.sql
psql "$DATABASE_URL" -f migrations/002_rename_password_to_password_hash.sql
psql "$DATABASE_URL" -f migrations/003_seed_curricula.sql
```

## Backend API Structure

### Routes

- **`/api/auth`** — Authentication (signup, login)
  - `POST /signup` — Register new student
  - `POST /login` — Authenticate and receive JWT token

- **`/api/admin`** — Admin provisioning (staff and student onboarding)
  - `POST /onboard-staff` — Create teacher or admin user
  - `POST /enroll-student` — Enroll student with curriculum assignment

- **`/api/resources`** — Curriculum content (subjects, units, topics, notes, videos)
  - `GET /subjects` — List all subjects
  - `GET /subjects/:subjectId/units` — Get units for a subject
  - `GET /units/:unitId/topics` — Get topics for a unit
  - `GET /topics/:topicId/notes` — Get study notes for a topic
  - `GET /topics/:topicId/videos` — Get videos for a topic
  - `POST /topics/:topicId/videos` — Upload/link video (teacher/admin only)

- **`/api/performance`** — Student performance tracking
  - `POST /record-marks` — Record student exam scores
  - `GET /student-report/:studentId` — Retrieve student performance report

### Middleware

- **`verifyToken`** — Validates JWT from `Authorization: Bearer <token>` header
- **`requireRole(roles[])`** — Restricts access to specific roles (teacher, admin, student)

## Key Backend Changes

### 1. Password Column Standardization

All user password inserts now use `password_hash` column (consistent with bcrypt naming):

```javascript
const queryText = `
  INSERT INTO users (username, email, password_hash, role, curriculum_id)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING *;
`;
```

### 2. Teacher ↔ Curriculum Relations

Teachers can now be assigned to multiple curricula via the `teacher_curricula` join table:

**Onboarding a teacher:**

```javascript
// Request payload
{
  "username": "jane_teach",
  "email": "jane@school.com",
  "password": "tempPass123",
  "role": "teacher",
  "curricula_ids": [1, 2]  // Assign to both Cambridge and UNEB
}
```

The backend will:

1. Create user in `users` table
2. Insert each curriculum ID into `teacher_curricula` table

### 3. Student Enrollment

Students must be assigned exactly one curriculum at enrollment:

```javascript
// Request payload
{
  "username": "alice_student",
  "email": "alice@school.com",
  "password": "tempPass456",
  "curriculum_id": 1  // Single curriculum (Cambridge)
}
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Environment Variables

Create `.env` with your database connection string and JWT secret.

### 3. Run Migrations

```bash
npm run migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:5000` (or `$PORT` if specified).

## Testing the Endpoints

### Example: Admin Onboarding a Teacher

```bash
# 1. Login as admin (you need an existing admin user)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"adminpass"}'

# Response includes "token"

# 2. Use token to onboard a teacher
curl -X POST http://localhost:5000/api/admin/onboard-staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "username":"mr_smith",
    "email":"smith@school.com",
    "password":"tempPass789",
    "role":"teacher",
    "curricula_ids":[1,2]
  }'
```

## Database Schema Overview

### Key Tables

- **`users`** — All accounts (students, teachers, admins)
  - Columns: `user_id`, `username`, `email`, `password_hash`, `role`, `curriculum_id`, etc.

- **`curricula`** — Curriculum standards (Cambridge, UNEB)
  - Columns: `curriculum_id`, `name`, `description`

- **`teacher_curricula`** — Many-to-many: which teachers teach which curricula
  - Columns: `teacher_id`, `curriculum_id`, `assigned_at`

- **`subjects`** — Course subjects (Math, English, Science, etc.)
- **`units`** — Chapters/units within subjects
- **`topics`** — Individual lessons/topics within units
- **`notes`** — Study materials (PDFs, documents) for topics
- **`videos`** — Video resources (YouTube links) for topics
- **`student_marks`** — Student exam scores and performance records

## Troubleshooting

### Migration Fails: Foreign Key Constraint

If `teacher_curricula` migration fails, ensure `users` table exists with `user_id` as primary key.

### Column Already Exists Error

The `002_rename_password_to_password_hash.sql` migration safely skips if column already renamed. This is expected on subsequent runs.

### Token Expired During Admin Provisioning

JWT tokens expire after 24 hours. Login again to get a fresh token.

## Next Steps

- [ ] Frontend: Fix API calls to use centralized API instance (see `frontend/src/api.js`)
- [ ] Frontend: Build teacher content upload UI for notes/videos
- [ ] Backend: Add file storage integration (Supabase Storage or S3) for study materials
- [ ] Security: Implement refresh tokens for longer-lived sessions
- [ ] Testing: Write integration tests for admin provisioning and resource endpoints
