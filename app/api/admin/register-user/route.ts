import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { requireAdmin, requireAuthUserIdFromBearer } from '@/lib/auth/apiAuth';
import { createUserSchema } from '@/lib/validation/admin';

// Validate and sanitize incoming request data
function validateRequest(data: unknown) {
  const parsed = createUserSchema.parse(data);
  return {
    ...parsed,
    email: parsed.email.toLowerCase().trim(),
    first_name: parsed.first_name.trim(),
    last_name: parsed.last_name.trim(),
    phone: parsed.phone.trim(),
    department: parsed.department.trim(),
  };
}


export async function POST(request: NextRequest) {
  try {
    // === 1. Authenticate request ===
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });

    const userId = await requireAuthUserIdFromBearer(request as unknown as Request);

    try {
      await requireAdmin(userId);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Insufficient privileges';
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }

    // === 2. Validate input data ===
    const data = await request.json();
    const validated = validateRequest(data);

    // === 3. Prevent duplicate user by checking Supabase Auth users ===
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
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
        }, { onConflict: 'auth_user_id' });

      if (profileError) {
        // Rollback Auth user creation on failure
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json({ error: 'Failed to create or update user profile' }, { status: 500 });
      }

    } else {
      // Option 1: Check if profile exists before insert
      const { data: existingProfile, error: profileFetchError } = await supabaseAdmin
        .from('users')
        .select('auth_user_id')
        .eq('auth_user_id', authData.user.id)
        .single();

      if (profileFetchError && profileFetchError.code !== 'PGRST116') {
        // Real error besides "no rows found"
        // Rollback Auth user creation on failure
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json({ error: 'Failed to check user profile' }, { status: 500 });
      }

      if (existingProfile) {
        // Profile already exists - skip insert
      } else {
        const { error: profileError } = await supabaseAdmin
          .from('users')
          .insert({
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
        // Note: We don't rollback here as the user is already created
        // The teacher record can be created later through the UI
      }
    }

    // === 7. Success response ===
    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
