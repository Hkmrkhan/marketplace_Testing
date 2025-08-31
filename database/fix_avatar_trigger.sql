-- Fix Avatar Upload Trigger (Supabase Storage Issue)
-- Run this in Supabase SQL Editor

-- 1. First, drop the existing trigger and function
DROP TRIGGER IF EXISTS avatar_upload_trigger ON storage.objects;
DROP FUNCTION IF EXISTS handle_avatar_upload();

-- 2. Create a new function that handles the missing 'url' field
CREATE OR REPLACE FUNCTION handle_avatar_upload()
RETURNS TRIGGER AS $$
DECLARE
  public_url TEXT;
BEGIN
  -- Get the public URL for the uploaded file
  SELECT storage.extension(name) INTO public_url 
  FROM storage.objects 
  WHERE id = NEW.id;
  
  -- If we can't get the URL directly, construct it manually
  IF public_url IS NULL THEN
    -- Construct URL manually using bucket and file path
    public_url := 'https://' || (SELECT name FROM storage.buckets WHERE id = NEW.bucket_id) || 
                  '.supabase.co/storage/v1/object/public/' || 
                  NEW.bucket_id || '/' || NEW.name;
  END IF;
  
  -- Update the profiles table with the new avatar URL
  UPDATE profiles 
  SET avatar_url = public_url 
  WHERE id = (storage.foldername(NEW.name))[1]::uuid;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger again
CREATE TRIGGER avatar_upload_trigger
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'user-avatars')
  EXECUTE FUNCTION handle_avatar_upload();

-- 4. Alternative: Create a simpler function without trigger
-- This function can be called manually if needed
CREATE OR REPLACE FUNCTION update_profile_avatar(file_path TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  public_url TEXT;
BEGIN
  -- Construct the public URL manually
  public_url := 'https://' || (SELECT name FROM storage.buckets WHERE id = 'user-avatars') || 
                '.supabase.co/storage/v1/object/public/user-avatars/' || file_path;
  
  -- Update the profile
  UPDATE profiles 
  SET avatar_url = public_url 
  WHERE id = user_id;
  
  RETURN public_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Verify the setup
SELECT 
  trigger_name,
  event_manipulation,
  event_object_schema,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'avatar_upload_trigger';

-- 6. Test the manual function
SELECT update_profile_avatar('test/test.jpg', '00000000-0000-0000-0000-000000000000');
