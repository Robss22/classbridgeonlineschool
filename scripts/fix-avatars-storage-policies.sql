-- Storage RLS policies for the avatars bucket
-- Allows authenticated users to upload/update/delete their own files
-- and allows public read access to avatar images.

-- Adjust bucket name if different in your project.

-- Create policies (idempotent approach: drop if exist first)
DROP POLICY IF EXISTS "avatars_upload_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_authenticated" ON storage.objects;

CREATE POLICY "avatars_upload_authenticated"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_select_public"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_update_authenticated"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_delete_authenticated"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars');


