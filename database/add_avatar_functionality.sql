-- Add avatar functionality to profiles table
-- Run this in Supabase SQL Editor

-- 1. Add avatar_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- 3. Set up storage policies for user avatars
-- Allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view all avatars (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Create function to handle avatar upload
CREATE OR REPLACE FUNCTION handle_avatar_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profiles table with the new avatar URL
  UPDATE profiles 
  SET avatar_url = NEW.url 
  WHERE id = (storage.foldername(NEW.name))[1]::uuid;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to automatically update profiles when avatar is uploaded
DROP TRIGGER IF EXISTS avatar_upload_trigger ON storage.objects;
CREATE TRIGGER avatar_upload_trigger
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'user-avatars')
  EXECUTE FUNCTION handle_avatar_upload();

-- 6. Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- 7. Verify the setup
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'avatar_url';

SELECT * FROM storage.buckets WHERE id = 'user-avatars';
