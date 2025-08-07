# Timetable and Live Classes System Implementation

## Overview

This document outlines the complete implementation of the timetable and live classes system for ClassBridge Online School. The system provides a professional workflow for managing class schedules, live sessions, and student enrollments.

## 🗄️ Database Schema

### Core Tables

#### 1. `timetables`
- **Purpose**: Main timetable entries for scheduled classes
- **Key Fields**: 
  - `timetable_id` (UUID, Primary Key)
  - `level_id`, `subject_id`, `teacher_id` (Foreign Keys)
  - `day_of_week`, `start_time`, `end_time`
  - `meeting_platform`, `meeting_link`, `meeting_id`, `meeting_password`
  - `is_active`, `academic_year`

#### 2. `student_timetables`
- **Purpose**: Many-to-many relationship between students and timetables
- **Key Fields**:
  - `id` (UUID, Primary Key)
  - `student_id`, `timetable_id` (Foreign Keys)
  - `enrollment_date`, `status` (active/inactive/completed)

#### 3. `live_classes`
- **Purpose**: Individual live class sessions
- **Key Fields**:
  - `live_class_id` (UUID, Primary Key)
  - `timetable_id` (optional reference to regular timetable)
  - `title`, `description`, `scheduled_date`
  - `start_time`, `end_time`, `meeting_link`
  - `status` (scheduled/ongoing/completed/cancelled)
  - `max_participants`

#### 4. `live_class_participants`
- **Purpose**: Track student participation in live classes
- **Key Fields**:
  - `id` (UUID, Primary Key)
  - `live_class_id`, `student_id` (Foreign Keys)
  - `join_time`, `leave_time`
  - `attendance_status` (registered/present/absent/late)

#### 5. `class_notifications`
- **Purpose**: System notifications for timetable and live class events
- **Key Fields**:
  - `notification_id` (UUID, Primary Key)
  - `timetable_id`, `live_class_id` (optional references)
  - `title`, `message`, `notification_type`
  - `scheduled_for`, `sent_at`, `created_by`

### Views

#### 1. `student_timetable_view`
- **Purpose**: Simplified view for student timetable access
- **Includes**: Subject, level, program, teacher names, meeting details

#### 2. `teacher_timetable_view`
- **Purpose**: Teacher-focused timetable view with student counts
- **Includes**: Subject, level, program, meeting details, student count

#### 3. `live_classes_view`
- **Purpose**: Comprehensive live class information
- **Includes**: Subject, level, program, teacher, participant count

## 🔐 Security Implementation

### Row Level Security (RLS) Policies

#### Timetables
```sql
-- Teachers can view their own timetables
CREATE POLICY "Teachers can view their own timetables" ON timetables
    FOR SELECT USING (teacher_id IN (
        SELECT teacher_id FROM teachers WHERE user_id = auth.uid()
    ));

-- Students can view their assigned timetables
CREATE POLICY "Students can view their assigned timetables" ON timetables
    FOR SELECT USING (timetable_id IN (
        SELECT timetable_id FROM student_timetables WHERE student_id = auth.uid()
    ));

-- Admins can manage all timetables
CREATE POLICY "Admins can manage all timetables" ON timetables
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));
```

#### Student Timetables
```sql
-- Students can view their own assignments
CREATE POLICY "Students can view their own timetable assignments" ON student_timetables
    FOR SELECT USING (student_id = auth.uid());

-- Admins can manage all assignments
CREATE POLICY "Admins can manage student timetable assignments" ON student_timetables
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));
```

#### Live Classes
```sql
-- Teachers can manage their live classes
CREATE POLICY "Teachers can manage their live classes" ON live_classes
    FOR ALL USING (teacher_id IN (
        SELECT teacher_id FROM teachers WHERE user_id = auth.uid()
    ));

-- Students can view relevant live classes
CREATE POLICY "Students can view live classes for their subjects" ON live_classes
    FOR SELECT USING (subject_id IN (
        SELECT DISTINCT s.subject_id 
        FROM student_timetables st
        JOIN timetables t ON st.timetable_id = t.timetable_id
        JOIN subjects s ON t.subject_id = s.subject_id
        WHERE st.student_id = auth.uid()
    ));
```

## 🚀 API Implementation

### Timetables API (`/api/timetables`)

#### GET `/api/timetables`
- **Purpose**: Fetch timetables with filtering
- **Query Parameters**:
  - `teacher_id`: Filter by teacher
  - `level_id`: Filter by level
  - `subject_id`: Filter by subject
  - `academic_year`: Filter by academic year
  - `is_active`: Filter by active status

#### POST `/api/timetables`
- **Purpose**: Create new timetable entry
- **Validation**:
  - Required fields: `level_id`, `subject_id`, `teacher_id`, `day_of_week`, `start_time`, `end_time`, `academic_year`
  - Time validation: End time must be after start time
  - Conflict checking: No overlapping times for same teacher

#### PUT `/api/timetables?id={id}`
- **Purpose**: Update existing timetable
- **Features**: Conflict checking, validation

#### DELETE `/api/timetables?id={id}`
- **Purpose**: Delete timetable entry

### Student Timetables API (`/api/student-timetables`)

#### GET `/api/student-timetables`
- **Purpose**: Fetch student timetable assignments
- **Query Parameters**:
  - `student_id`: Filter by student
  - `timetable_id`: Filter by timetable
  - `status`: Filter by status

#### POST `/api/student-timetables`
- **Purpose**: Assign student to timetable
- **Validation**:
  - No duplicate assignments
  - Timetable must exist and be active

#### PUT `/api/student-timetables?id={id}`
- **Purpose**: Update assignment status

#### DELETE `/api/student-timetables?id={id}`
- **Purpose**: Remove student from timetable

### Live Classes API (`/api/live-classes`)

#### GET `/api/live-classes`
- **Purpose**: Fetch live classes with filtering

#### POST `/api/live-classes`
- **Purpose**: Create new live class session

#### PUT `/api/live-classes?id={id}`
- **Purpose**: Update live class details

#### DELETE `/api/live-classes?id={id}`
- **Purpose**: Cancel live class

## 🎯 Professional Workflow

### Admin Workflow

1. **Create Timetables**
   ```typescript
   // Admin creates timetable entries
   POST /api/timetables
   {
     "level_id": "uuid",
     "subject_id": "uuid", 
     "teacher_id": "uuid",
     "day_of_week": "Monday",
     "start_time": "09:00",
     "end_time": "10:00",
     "academic_year": "2024"
   }
   ```

2. **Assign Students**
   ```typescript
   // Admin assigns students to timetables
   POST /api/student-timetables
   {
     "student_id": "uuid",
     "timetable_id": "uuid"
   }
   ```

3. **Manage Live Classes**
   - Schedule additional live sessions
   - Monitor attendance
   - Send notifications

### Teacher Workflow

1. **View Schedule**
   ```typescript
   // Teacher views their timetable
   GET /api/timetables?teacher_id={teacher_id}
   ```

2. **Schedule Live Classes**
   ```typescript
   // Teacher creates live class
   POST /api/live-classes
   {
     "title": "Advanced Mathematics",
     "scheduled_date": "2024-12-01",
     "start_time": "14:00",
     "end_time": "15:00",
     "teacher_id": "uuid",
     "level_id": "uuid",
     "subject_id": "uuid"
   }
   ```

3. **Manage Sessions**
   - Start/end live classes
   - Track attendance
   - Send notifications

### Student Workflow

1. **View Timetable**
   ```typescript
   // Student views personalized timetable
   GET /api/student-timetables?student_id={student_id}
   ```

2. **Join Live Classes**
   ```typescript
   // Student joins live class
   POST /api/live-class-participants
   {
     "live_class_id": "uuid",
     "student_id": "uuid"
   }
   ```

3. **Track Progress**
   - View attendance history
   - Access meeting links
   - Receive notifications

## 🔧 Technical Features

### Error Handling
- **Centralized Error Handler**: `@/lib/errorHandler`
- **Structured Error Responses**: Consistent error format
- **Validation**: Input validation and business logic checks

### Caching
- **In-Memory Cache**: `@/lib/cache`
- **Cache Keys**: Organized by data type and ID
- **Cache Invalidation**: Automatic cache clearing on updates

### Performance
- **Database Indexes**: Optimized for common queries
- **Views**: Simplified data access
- **Pagination**: Large dataset handling

### Security
- **Row Level Security**: Database-level access control
- **Input Validation**: Server-side validation
- **Rate Limiting**: API request throttling

## 📊 Data Flow

### Timetable Creation Flow
```
Admin → Create Timetable → Assign Students → Teachers View Schedule → Students Access
```

### Live Class Flow
```
Teacher → Schedule Live Class → Students Receive Notification → Join Session → Track Attendance
```

### Notification Flow
```
System Event → Create Notification → Send to Recipients → Update Status
```

## 🛠️ Implementation Steps

### 1. Database Migration
```bash
# Run the migration
supabase db push
```

### 2. TypeScript Types
```typescript
// Updated database.types.ts includes:
- timetables table
- student_timetables table  
- live_classes table
- live_class_participants table
- class_notifications table
- Views: student_timetable_view, teacher_timetable_view, live_classes_view
```

### 3. API Routes
- ✅ `/api/timetables` - Timetable management
- ✅ `/api/student-timetables` - Student assignments
- ✅ `/api/live-classes` - Live class management

### 4. Frontend Components
- ✅ Admin timetable management interface
- ✅ Teacher live class scheduling interface
- ✅ Student timetable viewing interface

## 🎨 UI Components

### Admin Interface
- **Timetable Management**: Create, edit, delete timetables
- **Student Assignment**: Assign students to timetables
- **Overview Dashboard**: View all schedules and statistics

### Teacher Interface
- **My Schedule**: View assigned timetables
- **Live Class Management**: Schedule and manage live sessions
- **Attendance Tracking**: Monitor student participation

### Student Interface
- **My Timetable**: View personalized schedule
- **Live Classes**: Join upcoming sessions
- **Progress Tracking**: View attendance and performance

## 🔄 Integration Points

### External Services
- **Meeting Platforms**: Zoom, Google Meet, Teams integration
- **Email Notifications**: Resend integration
- **Real-time Updates**: WebSocket support

### Existing System
- **User Authentication**: Supabase Auth integration
- **Role Management**: Admin, Teacher, Student roles
- **File Storage**: Supabase Storage for materials

## 📈 Monitoring and Analytics

### Key Metrics
- **Attendance Rates**: Student participation tracking
- **Class Utilization**: Timetable efficiency
- **Teacher Workload**: Schedule distribution
- **System Performance**: API response times

### Logging
- **Error Tracking**: Comprehensive error logging
- **Audit Trail**: User action tracking
- **Performance Monitoring**: Response time tracking

## 🚀 Deployment

### Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# External Services
ZOOM_API_KEY=your_zoom_api_key
ZOOM_API_SECRET=your_zoom_api_secret
RESEND_API_KEY=your_resend_api_key
```

### Database Setup
```sql
-- Run migration
\i supabase/migrations/20241201000000_timetable_live_classes.sql
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 📚 Documentation

### API Documentation
- **OpenAPI/Swagger**: Complete API documentation
- **TypeScript Types**: Full type definitions
- **Example Requests**: Sample API calls

### User Guides
- **Admin Guide**: Timetable management procedures
- **Teacher Guide**: Live class scheduling
- **Student Guide**: Accessing classes and sessions

## 🔮 Future Enhancements

### Planned Features
- **Calendar Integration**: Google Calendar sync
- **Mobile App**: Native mobile application
- **Advanced Analytics**: Detailed reporting
- **AI Scheduling**: Intelligent timetable optimization

### Scalability
- **Microservices**: Service decomposition
- **Caching Layer**: Redis integration
- **CDN**: Global content delivery
- **Load Balancing**: High availability setup

---

This implementation provides a robust, scalable, and professional timetable and live classes system that integrates seamlessly with the existing ClassBridge Online School platform.
