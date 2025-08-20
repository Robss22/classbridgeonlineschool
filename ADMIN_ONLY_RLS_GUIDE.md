# 🔒 **Admin-Only RLS Setup Guide**

## **Overview**
This guide sets up Row Level Security policies that **only allow administrators** to access the data. This is a simplified approach that avoids complex user role checks.

## **What This Does:**
- ✅ **Admins**: Can access everything (view, create, update, delete)
- ❌ **Non-Admins**: Cannot access any data (students, teachers, regular users)
- 🔐 **Edge Functions**: Still work (bypass RLS with service_role key)

---

## **🚀 Quick Setup (Supabase Dashboard)**

### **Step 1: Enable RLS on Tables**

Go to your Supabase Dashboard → **Database** → **Tables**

#### **Applications Table**
```sql
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
```

#### **Users Table**
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### **Step 2: Create Admin-Only Policies**

#### **Applications Table - Admin Only Access**

**View Applications (Admin Only)**
```sql
CREATE POLICY "Admin only - view applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = (auth.uid()::text)
            AND users.role = 'admin'
        )
    );
```

**Create Applications (Admin Only)**
```sql
CREATE POLICY "Admin only - create applications" ON applications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = (auth.uid()::text)
            AND users.role = 'admin'
        )
    );
```

**Update Applications (Admin Only)**
```sql
CREATE POLICY "Admin only - update applications" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = (auth.uid()::text)
            AND users.role = 'admin'
        )
    );
```

**Delete Applications (Admin Only)**
```sql
CREATE POLICY "Admin only - delete applications" ON applications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = (auth.uid()::text)
            AND users.role = 'admin'
        )
    );
```

#### **Users Table - Admin Only Access**

**View Users (Admin Only)**
```sql
CREATE POLICY "Admin only - view users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );
```

**Create Users (Admin Only)**
```sql
CREATE POLICY "Admin only - create users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );
```

**Update Users (Admin Only)**
```sql
CREATE POLICY "Admin only - update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );
```

**Delete Users (Admin Only)**
```sql
CREATE POLICY "Admin only - delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );
```

### **Step 3: Create Performance Indexes**

```sql
-- Applications table indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

---

## **🔧 How to Apply**

### **Option 1: SQL Editor (Recommended)**
1. Go to **SQL Editor** in your Supabase Dashboard
2. Copy and paste each policy SQL statement
3. Run them one by one
4. Check for any errors

### **Option 2: Use the Migration File**
- Copy the content from `supabase/migrations/20250818_admin_only_rls.sql`
- Paste it into the SQL Editor
- Run the entire script

---

## **🧪 Testing**

### **Test 1: Admin Access**
```sql
-- Login as admin user
-- This should show all applications
SELECT * FROM applications;
```

### **Test 2: Non-Admin Access**
```sql
-- Login as non-admin user (student/teacher)
-- This should show NO data
SELECT * FROM applications;
```

### **Test 3: Check Policies**
```sql
-- Verify policies are created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('applications', 'users');
```

---

## **⚠️ Important Notes**

### **What This Means:**
- **Only admins can access the data** through the web interface
- **Students and teachers cannot see any data** (this might be too restrictive)
- **Edge Functions still work** (they use service_role key)

### **Edge Functions:**
- Your approval system will continue to work
- Edge Functions bypass RLS using service_role key
- This is intentional and secure

### **If You Need More Access:**
If you find this too restrictive, you can later add policies for:
- Students to see their own data
- Teachers to see relevant student data
- Public access to certain information

---

## **🚨 Troubleshooting**

### **Common Issues:**

**"No data showing"**
- Check if you're logged in as an admin user
- Verify the user has `role = 'admin'` in the users table

**"Policy creation failed"**
- Ensure RLS is enabled on the table first
- Check SQL syntax
- Verify you have permission to create policies

**"Edge Function not working"**
- Edge Functions should NOT be affected by RLS
- They use service_role key which bypasses RLS
- Check Edge Function logs separately

### **Debug Queries:**

```sql
-- Check current user and role
SELECT 
    auth.uid() as current_user_id,
    (auth.uid()::text) as current_user_id_text;

-- Check if current user is admin
SELECT id, role, email 
FROM users 
WHERE id = (auth.uid()::text);

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('applications', 'users');
```

---

## **✅ Verification Checklist**

- [ ] RLS enabled on `applications` table
- [ ] RLS enabled on `users` table
- [ ] All admin policies created successfully
- [ ] Indexes created for performance
- [ ] Admin users can access data
- [ ] Non-admin users cannot access data
- [ ] Edge Function still works
- [ ] No UUID comparison errors
- [ ] No column not found errors

---

## **🔄 Next Steps (Optional)**

If you want to add more access later:

1. **Students**: Add policies to see their own data
2. **Teachers**: Add policies to see relevant student data
3. **Public**: Add policies for public information

But start with admin-only and test thoroughly first!

---

## **📞 Support**

**Remember**: This is a simplified approach that only allows admins. If you need more granular access control, we can add it step by step after confirming the basic setup works.
