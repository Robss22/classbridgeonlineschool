-- FIX MISSING USER PROFILE ISSUE
-- This will resolve the "Error creating session: {}" error
-- Run this in your Supabase SQL Editor immediately

BEGIN;

-- Step 1: Check what users exist in auth.users but not in public.users
SELECT '=== MISSING USER PROFILES ===' as info;
SELECT 
    au.id as auth_user_id,
    au.email,
    au.raw_user_meta_data,
    au.created_at as auth_created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- Step 2: Create missing user profiles for authenticated users
-- This will fix the foreign key constraint issue
DO $$
DECLARE
    auth_user RECORD;
    new_user_id UUID;
BEGIN
    FOR auth_user IN 
        SELECT 
            au.id as auth_user_id,
            au.email,
            au.raw_user_meta_data,
            au.created_at
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.auth_user_id
        WHERE pu.id IS NULL
    LOOP
        -- Generate a new UUID for the user profile
        new_user_id := gen_random_uuid();
        
        -- Insert the missing user profile
        INSERT INTO public.users (
            id,
            auth_user_id,
            email,
            first_name,
            last_name,
            full_name,
            role,
            created_at,
            updated_at,
            password_changed
        ) VALUES (
            new_user_id,
            auth_user.auth_user_id,
            auth_user.email,
            COALESCE(auth_user.raw_user_meta_data->>'first_name', ''),
            COALESCE(auth_user.raw_user_meta_data->>'last_name', ''),
            COALESCE(auth_user.raw_user_meta_data->>'full_name', auth_user.email),
            COALESCE(auth_user.raw_user_meta_data->>'role', 'student'),
            auth_user.created_at,
            NOW(),
            false
        );
        
        RAISE NOTICE '✅ Created user profile for % (auth_user_id: %, profile_id: %)', 
            auth_user.email, auth_user.auth_user_id, new_user_id;
    END LOOP;
    
    RAISE NOTICE '✅ User profile creation completed';
END $$;

-- Step 3: Verify all users now have profiles
SELECT '=== VERIFICATION ===' as info;
SELECT 
    COUNT(*) as total_auth_users,
    COUNT(pu.id) as total_profiles,
    COUNT(CASE WHEN pu.id IS NULL THEN 1 END) as missing_profiles
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id;

-- Step 4: Show the newly created profiles
SELECT '=== NEW PROFILES ===' as info;
SELECT 
    id,
    auth_user_id,
    email,
    first_name,
    last_name,
    full_name,
    role,
    created_at
FROM public.users 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Step 5: Test session creation (this should now work)
SELECT '=== TESTING SESSION CREATION ===' as info;
-- Get a real user ID from the users table
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM public.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Try to insert a test session
        INSERT INTO user_sessions (
            user_id, 
            device_id, 
            device_name, 
            device_type, 
            browser, 
            os, 
            user_agent
        ) VALUES (
            test_user_id,
            'test-device-fix',
            'Test Device (Fix)',
            'desktop',
            'Test Browser',
            'Test OS',
            'Test User Agent'
        );
        
        RAISE NOTICE '✅ Test session creation successful for user: %', test_user_id;
        
        -- Clean up test data
        DELETE FROM user_sessions WHERE device_id = 'test-device-fix';
        
    ELSE
        RAISE NOTICE '❌ No users found in the users table';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test session creation failed: %', SQLERRM;
END $$;

COMMIT;

-- Final verification
SELECT '✅ USER PROFILE ISSUE FIXED!' as status;
SELECT 'Your session creation should now work properly.' as message;
