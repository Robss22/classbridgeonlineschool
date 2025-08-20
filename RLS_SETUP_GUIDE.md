# 🔒 **RLS (Row Level Security) Setup Guide**

## **Overview**
This guide explains how to set up Row Level Security policies for the application approval system. RLS ensures that users can only access data they're authorized to see.

## **What is RLS?**
Row Level Security (RLS) is a PostgreSQL feature that restricts which rows users can access in a table. It's enforced at the database level, making it impossible to bypass through the application layer.

## **Key Benefits**
- **Security**: Users can only see their own data
- **Data Isolation**: Teachers see only relevant student data
- **Admin Access**: Administrators have full access to manage the system
- **Audit Trail**: All access is logged and controlled

## **Tables with RLS**
1. **`applications`** - Student applications
2. **`users`** - User profiles and authentication
3. **`enrollments`** - Student course enrollments
4. **`teacher_assignments`** - Teacher class assignments
5. **`subject_offerings`** - Available subjects

---

## **🚀 Manual Setup (Supabase Dashboard)**

### **Step 1: Enable RLS on Tables**

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Tables**
3. For each table below, click on it and enable RLS:

#### **Applications Table**
```sql
-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
```

#### **Users Table**
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### **Step 2: Create RLS Policies**

#### **Applications Table Policies**

**Policy 1: Users can view own applications**
```sql
CREATE POLICY "Users can view own applications" ON applications
    FOR SELECT USING (
        (auth.uid()::text) = user_id OR 
        (auth.uid()::text) = auth_user_id
    );
```

**Policy 2: Users can create applications**
```sql
CREATE POLICY "Users can create applications" ON applications
    FOR INSERT WITH CHECK (
        (auth.uid()::text) = user_id OR 
        (auth.uid()::text) = auth_user_id
    );
```

**Policy 3: Users can update own applications**
```sql
CREATE POLICY "Users can update own applications" ON applications
    FOR UPDATE USING (
        (auth.uid()::text) = user_id OR 
        (auth.uid()::text) = auth_user_id
    );
```

**Policy 4: Admins can view all applications**
```sql
CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = (auth.uid()::text)
            AND users.role = 'admin'
        )
    );
```

**Policy 5: Admins can update all applications**
```sql
CREATE POLICY "Admins can update all applications" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = (auth.uid()::text)
            AND users.role = 'admin'
        )
    );
```

**Policy 6: Teachers can view applications**
```sql
CREATE POLICY "Teachers can view applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'teacher'
        )
    );
```

#### **Users Table Policies**

**Policy 1: Users can view own profile**
```sql
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        (auth.uid()::text) = id OR 
        (auth.uid()::text) = auth_user_id
    );
```

**Policy 2: Users can update own profile**
```sql
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        (auth.uid()::text) = id OR 
        (auth.uid()::text) = auth_user_id
    );
```

**Policy 3: Admins can view all users**
```sql
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );
```

**Policy 4: Admins can update all users**
```sql
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );
```

**Policy 5: Teachers can view students**
```sql
CREATE POLICY "Teachers can view students" ON users
    FOR SELECT USING (
        role = 'student' AND
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'teacher'
        )
    );
```

### **Step 3: Create Performance Indexes**

```sql
-- Applications table indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_auth_user_id ON applications(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

---

## **🔧 How to Apply Policies**

### **Option 1: SQL Editor (Recommended)**
1. Go to **SQL Editor** in your Supabase Dashboard
2. Copy and paste each policy SQL statement
3. Run them one by one
4. Check for any errors

### **Option 2: Table Policies UI**
1. Go to **Database** → **Tables**
2. Click on a table (e.g., `applications`)
3. Go to **Policies** tab
4. Click **New Policy**
5. Use the **Custom** option and paste the SQL

---

## **🧪 Testing RLS Policies**

### **Test 1: User Access**
```sql
-- Test as a regular user
-- This should only show their own applications
SELECT * FROM applications;
```

### **Test 2: Admin Access**
```sql
-- Test as an admin user
-- This should show all applications
SELECT * FROM applications;
```

### **Test 3: Teacher Access**
```sql
-- Test as a teacher user
-- This should show applications they're authorized to see
SELECT * FROM applications;
```

---

## **⚠️ Important Notes**

### **Edge Functions and RLS**
- **Edge Functions use `service_role` key** which **bypasses RLS**
- This is intentional for the approval system
- Client-side access is controlled by RLS
- Server-side operations (Edge Functions) have full access

### **Authentication Context**
- `auth.uid()` returns the current user's UUID
- We cast it to text: `(auth.uid()::text)` with proper parentheses
- This matches the string fields in your tables
- **Important**: The parentheses ensure proper type casting precedence

### **Role-Based Access**
- **Students**: Can only see their own data
- **Teachers**: Can see student data and applications
- **Admins**: Have full access to everything

---

## **🚨 Troubleshooting**

### **Common Issues**

**Issue: "operator does not exist: text = uuid"**
- **Solution**: Use `(auth.uid()::text)` with parentheses
- This ensures proper type casting from UUID to text
- The parentheses prevent operator precedence issues

**Issue: "Policy creation failed"**
- Check if RLS is enabled on the table
- Verify the SQL syntax
- Ensure the user has permission to create policies

**Issue: "Users can't see any data"**
- Check if policies are too restrictive
- Verify the `auth.uid()` function works
- Test with different user roles

**Issue: "Performance problems"**
- Ensure indexes are created
- Check if policies use efficient queries
- Monitor query execution plans

### **Debug Queries**

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('applications', 'users');

-- Check existing policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('applications', 'users');

-- Test current user context
SELECT auth.uid(), auth.uid()::text, (auth.uid()::text);

-- Test type casting
SELECT 
    pg_typeof(auth.uid()) as uid_type,
    pg_typeof(auth.uid()::text) as uid_text_type,
    pg_typeof((auth.uid()::text)) as uid_parens_type;
```

---

## **✅ Verification Checklist**

- [ ] RLS enabled on `applications` table
- [ ] RLS enabled on `users` table
- [ ] All policies created successfully
- [ ] Indexes created for performance
- [ ] Tested with different user roles
- [ ] Edge Function still works (bypasses RLS)
- [ ] Client-side access is properly restricted
- [ ] No UUID/text comparison errors

---

## **🔗 Related Files**

- `supabase/migrations/20250818_simple_rls_policies.sql` - Migration file
- `supabase/functions/approve-application/index.ts` - Edge Function
- `app/api/approve-application/route.js` - API Route

---

## **📞 Support**

If you encounter issues:
1. Check the Supabase logs
2. Verify policy syntax
3. Test with simple policies first
4. Use the debug queries above
5. **Most common fix**: Use `(auth.uid()::text)` with parentheses

**Remember**: RLS is enforced at the database level, so it's very secure but can be complex to debug. Start simple and add complexity gradually.
