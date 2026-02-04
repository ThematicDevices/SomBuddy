-- ============================================================================
-- SomBuddy: Wine Image Storage Migration
-- ============================================================================
-- This migration sets up Supabase Storage for wine label images.
-- Run this in the Supabase SQL Editor.
-- ============================================================================

-- Create the storage bucket for wine images
-- This is done via the Supabase Dashboard typically, but can also be done via SQL
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wine-images',
  'wine-images',
  true,  -- Public bucket so images can be viewed without authentication
  5242880,  -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- Row Level Security (RLS) Policies for Storage
-- ============================================================================

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload their own wine images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wine-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update/replace their own images
CREATE POLICY "Users can update their own wine images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'wine-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'wine-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own wine images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wine-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to read/view images (since bucket is public)
CREATE POLICY "Anyone can view wine images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wine-images');

-- ============================================================================
-- Optional: Add image_storage_path column to wines table
-- ============================================================================
-- If you want to store both the storage path AND legacy base64 data:

ALTER TABLE wines
ADD COLUMN IF NOT EXISTS label_image_storage_path TEXT;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wines_image_storage_path
ON wines(label_image_storage_path)
WHERE label_image_storage_path IS NOT NULL;

-- ============================================================================
-- Optional: Function to clean up orphaned images
-- ============================================================================
-- This function can be called periodically to remove images that are no longer
-- associated with any wine record.

CREATE OR REPLACE FUNCTION cleanup_orphaned_wine_images()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  orphan_path TEXT;
BEGIN
  -- Find storage paths that don't match any wine record
  FOR orphan_path IN
    SELECT name FROM storage.objects
    WHERE bucket_id = 'wine-images'
    AND name NOT IN (
      SELECT label_image_storage_path FROM wines
      WHERE label_image_storage_path IS NOT NULL
    )
  LOOP
    -- Delete the orphaned file
    DELETE FROM storage.objects
    WHERE bucket_id = 'wine-images' AND name = orphan_path;
    deleted_count := deleted_count + 1;
  END LOOP;

  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- Usage Notes:
-- ============================================================================
--
-- 1. Images are stored in the path: {user_id}/{wine_id}.jpg
--
-- 2. The public URL format is:
--    https://{project}.supabase.co/storage/v1/object/public/wine-images/{path}
--
-- 3. For thumbnails with image transformations:
--    https://{project}.supabase.co/storage/v1/render/image/public/wine-images/{path}?width=200&height=200
--
-- 4. To migrate existing base64 images to storage:
--    - Use the migration utility in the app
--    - Or run a batch script to upload existing images
--
