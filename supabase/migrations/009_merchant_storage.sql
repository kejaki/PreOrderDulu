-- Enable Storage Extension (if not already enabled, usually enabled by default on Supabase Cloud)
-- no extension needed for storage, it's a separate schema
-- 0. Add Missing Columns to merchants table
ALTER TABLE public.merchants
ADD COLUMN IF NOT EXISTS banner_url TEXT,
    ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(100);
-- 1. Create the 'merchants' bucket for public access
INSERT INTO storage.buckets (id, name, public)
VALUES ('merchants', 'merchants', true) ON CONFLICT (id) DO NOTHING;
-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view merchant images" ON storage.objects;
DROP POLICY IF EXISTS "Merchants can upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Merchants can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Merchants can delete own images" ON storage.objects;
-- 3. Policy: Public Read Access
CREATE POLICY "Public can view merchant images" ON storage.objects FOR
SELECT USING (bucket_id = 'merchants');
-- 4. Policy: Authenticated Upload (Insert)
-- Allow upload if the user is authenticated and the path matches their user ID
-- Path convention: {user_id}/{filename}
CREATE POLICY "Merchants can upload own images" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'merchants'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- 5. Policy: Authenticated Update
CREATE POLICY "Merchants can update own images" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'merchants'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- 6. Policy: Authenticated Delete
CREATE POLICY "Merchants can delete own images" ON storage.objects FOR DELETE USING (
    bucket_id = 'merchants'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name)) [1] = auth.uid()::text
);