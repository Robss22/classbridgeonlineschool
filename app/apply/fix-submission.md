# Application Submission Fix

After analyzing both the database structure and the client code, here's what needs to be modified:

1. First, apply the SQL fixes in `final-rls-fix.sql` to properly set up the RLS policies.

2. Then modify the form submission code in `page.tsx`. The current insert statement needs to be modified to match the exact column names in the database. Here's how the insert should look:

```typescript
const { data: applicationInsertData, error: applicationInsertError } = await supabase
  .from('applications')
  .insert([
    {
      first_name: form.firstName,
      last_name: form.lastName,
      gender: form.gender,
      dob: form.dob,
      nationality: form.nationality,
      curriculum: form.curriculumName,
      program_id: form.curriculum,
      class: form.className,
      parent_name: form.parentName,
      parent_contact: form.parentContact,
      parent_email: form.email,
      about_student: form.about,
      consent: form.consent,
      document_url: academicDocsUrl,
      status: 'pending'
      // Note: these fields are handled automatically by the database:
      // application_id (uuid_generate_v4)
      // submitted_at (now())
      // updated_at (now())
      // created_at (timezone('utc'::text, now()))
    }
  ])
  .select('application_id');
```

The key changes are:

1. Simplified RLS policies that explicitly allow public submissions
2. Added proper grants for both anonymous and authenticated users
3. Ensured the insert matches the exact column names in the database
4. Removed any extra columns that aren't needed for the initial submission

After applying both fixes:
1. The RLS policy should allow anonymous submissions
2. The column names will match exactly
3. The insert should work without authentication
4. The automatic timestamps will be handled by the database

Let me know if you want me to help implement these changes in the actual code files.
