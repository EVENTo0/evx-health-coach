-- ================================================================
-- EVX Storage Buckets
-- ================================================================

-- Lab reports storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lab_reports',
  'lab_reports',
  FALSE,  -- Private bucket
  10485760,  -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- User avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  2097152,  -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- STORAGE RLS POLICIES
-- ================================================================

-- Lab reports: users can only access their own files
CREATE POLICY "Users can upload own lab reports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'lab_reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own lab reports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'lab_reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own lab reports" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'lab_reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Avatars: public read, own write
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
