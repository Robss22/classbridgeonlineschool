# Teacher Access Control System Guide

## Overview

This document explains the comprehensive teacher access control system implemented in the ClassBridge Online School platform. The system ensures that teachers can only create and manage resources and assessments for their assigned subjects and levels.

## 🎯 Key Features

### 1. **Frontend Access Control**
- **TeacherResourceForm**: Custom form that only shows assigned subjects and levels
- **TeacherAssessmentForm**: Custom form that only shows assigned subjects and levels
- **TeacherAccessControl**: Reusable component that fetches and filters teacher assignments
- **Dynamic Filtering**: Dropdowns automatically filter based on teacher assignments

### 2. **Database-Level Security**
- **Row Level Security (RLS)**: Database policies prevent unauthorized access
- **Triggers**: Database triggers validate assignments before insert/update
- **Functions**: Helper functions check teacher assignments and admin status
- **Indexes**: Optimized database indexes for performance

### 3. **Multi-Layer Protection**
- **Frontend**: UI prevents selection of unassigned subjects/levels
- **Backend**: API validation ensures data integrity
- **Database**: Triggers and RLS provide final security layer

## 🏗️ Architecture

### Frontend Components

#### 1. TeacherAccessControl Component
```typescript
// Fetches teacher assignments and provides filtered data
<TeacherAccessControl>
  {({ teacherAssignments, availablePrograms, availableLevels, availableSubjects }) => {
    // Use filtered data here
  }}
</TeacherAccessControl>
```

#### 2. TeacherResourceForm Component
- Only shows programs, levels, and subjects the teacher is assigned to
- Validates selections against teacher assignments
- Prevents creation of resources for unassigned subjects/levels

#### 3. TeacherAssessmentForm Component
- Similar to TeacherResourceForm but for assessments
- Ensures teachers can only create assessments for their assignments
- Includes paper selection based on subject

### Database Security

#### 1. Row Level Security (RLS) Policies
```sql
-- Teachers can only access their assigned resources
CREATE POLICY "Teachers can only access their assigned resources" ON resources
  FOR ALL USING (
    (is_admin(auth.uid()) OR 
     (auth.uid() = uploaded_by AND 
      check_teacher_assignment(auth.uid(), subject_id, level_id)))
  WITH CHECK (
    (is_admin(auth.uid()) OR 
     (auth.uid() = uploaded_by AND 
      check_teacher_assignment(auth.uid(), subject_id, level_id)))
);
```

#### 2. Database Triggers
```sql
-- Validates teacher assignments before insert/update
CREATE TRIGGER validate_teacher_resource_access_trigger
  BEFORE INSERT OR UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION validate_teacher_resource_access();
```

#### 3. Helper Functions
```sql
-- Checks if teacher is assigned to subject and level
CREATE FUNCTION check_teacher_assignment(
  p_teacher_user_id UUID,
  p_subject_id UUID,
  p_level_id UUID
) RETURNS BOOLEAN
```

## 🔧 Implementation Steps

### Step 1: Run Database Migration
Execute the SQL script to set up database-level security:
```bash
# Run in Supabase SQL Editor
teacher-access-control-constraints.sql
```

### Step 2: Update Frontend Components
The following components have been updated:
- `TeacherAccessControl.tsx` - New component for access control
- `TeacherResourceForm.tsx` - Teacher-specific resource form
- `TeacherAssessmentForm.tsx` - Teacher-specific assessment form
- `app/teachers/resources/page.tsx` - Updated to use TeacherResourceForm
- `app/assessments/page.tsx` - Updated to use TeacherAssessmentForm for teachers

### Step 3: Test the System
1. **Assign a teacher** to specific subjects and levels using admin interface
2. **Login as teacher** and verify only assigned subjects/levels are shown
3. **Try to create resources/assessments** for unassigned subjects (should fail)
4. **Verify database constraints** prevent unauthorized access

## 🛡️ Security Features

### 1. Frontend Protection
- **Dynamic Filtering**: Dropdowns only show assigned subjects/levels
- **Form Validation**: Prevents submission with invalid selections
- **User Feedback**: Clear messages when no assignments exist

### 2. Backend Protection
- **API Validation**: Server-side checks before database operations
- **Error Handling**: Proper error messages for unauthorized actions
- **Logging**: Audit trail for security events

### 3. Database Protection
- **Row Level Security**: Database policies control access
- **Triggers**: Automatic validation on insert/update
- **Functions**: Reusable security checks
- **Indexes**: Performance optimization for security queries

## 📋 Usage Examples

### For Teachers

#### Creating a Resource
1. Navigate to `/teachers/resources`
2. Click "Add Resource"
3. Select from available programs (only assigned ones shown)
4. Select from available levels (filtered by program)
5. Select from available subjects (filtered by level and assignments)
6. Upload file or provide URL
7. Submit (validated at multiple levels)

#### Creating an Assessment
1. Navigate to `/assessments`
2. Click "Create Assessment"
3. Follow similar process as resources
4. Additional options for assessment type, due date, and papers

### For Administrators

#### Assigning Teachers
1. Navigate to `/admin/users`
2. Find the teacher
3. Use "Assign Class" feature
4. Select subject and level combinations
5. Save assignment

#### Monitoring Access
- View teacher assignments in admin dashboard
- Check resource/assessment creation logs
- Monitor database security events

## 🔍 Testing the System

### Test Cases

#### 1. Teacher Assignment Test
```sql
-- Check teacher assignments
SELECT * FROM teacher_assignments_view WHERE teacher_name = 'Teacher Name';
```

#### 2. Access Control Test
```sql
-- Test if teacher can access specific resource
SELECT can_access_resource('teacher-user-id', 'resource-id');
```

#### 3. Security Test
```sql
-- Try to create resource for unassigned subject (should fail)
INSERT INTO resources (title, subject_id, level_id, uploaded_by) 
VALUES ('Test', 'unassigned-subject-id', 'unassigned-level-id', 'teacher-user-id');
```

### Manual Testing Steps

1. **Setup**: Assign teacher to specific subjects and levels
2. **Login**: Login as teacher
3. **Create Resource**: Try to create resource for assigned subject/level
4. **Create Assessment**: Try to create assessment for assigned subject/level
5. **Unauthorized Test**: Try to create for unassigned subject/level (should fail)
6. **Admin Test**: Login as admin and verify full access

## 🚨 Troubleshooting

### Common Issues

#### 1. Teacher Can't See Any Options
- **Cause**: No teacher assignments in database
- **Solution**: Assign teacher to subjects and levels via admin interface

#### 2. Database Errors on Resource Creation
- **Cause**: Teacher trying to create for unassigned subject/level
- **Solution**: Check teacher assignments and update if needed

#### 3. Performance Issues
- **Cause**: Missing database indexes
- **Solution**: Run the index creation part of the SQL script

#### 4. RLS Policy Errors
- **Cause**: Incorrect policy configuration
- **Solution**: Check RLS policies and function definitions

### Debug Queries

```sql
-- Check teacher assignments
SELECT * FROM teacher_assignments_view;

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename IN ('resources', 'assessments');

-- Test teacher assignment function
SELECT check_teacher_assignment('teacher-user-id', 'subject-id', 'level-id');

-- Check if user is admin
SELECT is_admin('user-id');
```

## 📊 Monitoring and Maintenance

### Regular Checks

1. **Weekly**: Review teacher assignments and access logs
2. **Monthly**: Check database performance and index usage
3. **Quarterly**: Review and update security policies

### Performance Monitoring

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('resources', 'assessments', 'teacher_assignments');

-- Check RLS policy performance
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('resources', 'assessments');
```

## 🔄 Updates and Maintenance

### Adding New Security Features

1. **Frontend**: Update TeacherAccessControl component
2. **Backend**: Add new validation functions
3. **Database**: Create new RLS policies or triggers
4. **Testing**: Comprehensive testing of new features

### Updating Existing Features

1. **Review**: Analyze current security requirements
2. **Update**: Modify components and database constraints
3. **Test**: Verify all functionality still works
4. **Deploy**: Roll out changes carefully

## 📞 Support

For issues with the teacher access control system:

1. **Check logs**: Review application and database logs
2. **Test manually**: Follow the testing steps above
3. **Verify assignments**: Ensure teacher has proper assignments
4. **Contact admin**: For database-level issues

## 🎯 Best Practices

### For Developers

1. **Always use TeacherAccessControl** for teacher-specific forms
2. **Test thoroughly** before deploying changes
3. **Monitor performance** of security queries
4. **Document changes** to security policies

### For Administrators

1. **Regularly review** teacher assignments
2. **Monitor access logs** for security issues
3. **Update assignments** when teachers change roles
4. **Test the system** after any changes

### For Teachers

1. **Contact admin** if you can't see expected subjects/levels
2. **Report issues** with resource/assessment creation
3. **Follow guidelines** for creating content
4. **Use assigned subjects** only for content creation

---

This system provides comprehensive protection at multiple levels while maintaining usability and performance. Regular monitoring and updates ensure continued security and functionality. 