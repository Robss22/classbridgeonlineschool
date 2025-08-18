import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  gender: 'Male' | 'Female';
  role: 'admin' | 'teacher' | 'student';
  phone: string;
  department: string;
}

// Simple email format validation
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate and sanitize incoming request data
function validateRequest(data: any): CreateUserRequest {
  const {
    email, password, first_name, last_name,
    gender, role, phone, department,
  } = data;

  if (
    !email || !password || !first_name || !last_name ||
    !gender || !role || !phone || !department
  ) throw new Error('Missing required fields');

  if (!validateEmail(email)) throw new Error('Invalid email format');
  if (!['Male', 'Female'].includes(gender)) throw new Error('Invalid gender');
  if (!['admin', 'teacher', 'student'].includes(role)) throw new Error('Invalid role');

  return {
    email: email.toLowerCase().trim(),
    password,
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    gender,
    role,
    phone: phone.trim(),
    department: department.trim(),
  };
}

// Check if user has admin role in 'users' table
async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) throw new Error('User not found');
  return data.role === 'admin';
}

export async function POST(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server is not configured' }, { status: 500 });
    }
    // === 1. Authenticate request ===
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: tokenUser, error: tokenError } = await supabaseAdmin.auth.getUser(token);
    if (tokenError || !tokenUser?.user?.id) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const userId = tokenUser.user.id;

    const isAdmin = await checkIsAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: 'Insufficient privileges' }, { status: 403 });

    // === 2. Validate input data ===
    const data = await request.json();
    const validated = validateRequest(data);

    // === 3. Prevent duplicate user by checking Supabase Auth users ===
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 } as any);
    const users: { email?: string }[] = usersList?.users ?? [];
    if (users.some(u => (u.email || '').toLowerCase() === validated.email)) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // === 4. Create user in Supabase Auth ===
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true,
      user_metadata: {
        full_name: `${validated.first_name} ${validated.last_name}`,
        phone: validated.phone,
        role: validated.role,
      },
    });

    if (createUserError || !authData.user?.id) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // === 5. Create or update user profile in 'users' table ===

    // Toggle between Option 1 and Option 2 here:
    const useUpsert = true; // Set to false to use check-then-insert (Option 1)

    if (useUpsert) {
      // Option 2: Upsert (insert or update) profile row on conflict
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authData.user.id,
          auth_user_id: authData.user.id,
          first_name: validated.first_name,
          last_name: validated.last_name,
          email: validated.email,
          gender: validated.gender,
          phone: validated.phone,
          role: validated.role,
          department: validated.department,
          password_changed: validated.role === 'student' ? false : true,
          created_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
        // Rollback Auth user creation on failure
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json({ error: 'Failed to create or update user profile' }, { status: 500 });
      }

    } else {
      // Option 1: Check if profile exists before insert
      const { data: existingProfile, error: profileFetchError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (profileFetchError && profileFetchError.code !== 'PGRST116') {
        // Real error besides "no rows found"
        console.error('Error checking existing user profile:', profileFetchError);
        // Rollback Auth user creation on failure
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json({ error: 'Failed to check user profile' }, { status: 500 });
      }

      if (existingProfile) {
        // Profile already exists - skip insert
        console.log('User profile already exists, skipping insert');
      } else {
        const { error: profileError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            auth_user_id: authData.user.id,
            first_name: validated.first_name,
            last_name: validated.last_name,
            email: validated.email,
            gender: validated.gender,
            phone: validated.phone,
            role: validated.role,
            department: validated.department,
            password_changed: validated.role === 'student' ? false : true,
            created_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Profile insert error:', profileError);
          // Rollback Auth user creation on failure
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
        }
      }
    }

    // === 6. Create teacher record if role is 'teacher' ===
    if (validated.role === 'teacher') {
      const { error: teacherError } = await supabaseAdmin
        .from('teachers')
        .insert({
          user_id: authData.user.id,
          program_id: null, // Will be assigned later
          bio: null,
          created_at: new Date().toISOString(),
        });

      if (teacherError) {
        console.error('Teacher record creation error:', teacherError);
        // Note: We don't rollback here as the user is already created
        // The teacher record can be created later through the UI
        console.warn('Teacher record creation failed, but user was created successfully');
      } else {
        console.log('Teacher record created successfully for user:', authData.user.id);
      }
    }

    // === 7. Success response ===
    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 400 });
  }
}
