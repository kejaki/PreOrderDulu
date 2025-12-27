-- ============================================================================
-- SQL: NEW RLS POLICIES & STORAGE BUCKETS (PRODUCTION READY)
-- ============================================================================
-- 1. Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-images', 'food-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', true) ON CONFLICT (id) DO NOTHING;
-- 2. Storage Policies for 'food-images'
DROP POLICY IF EXISTS "Public can view food images" ON storage.objects;
CREATE POLICY "Public can view food images" ON storage.objects FOR
SELECT USING (bucket_id = 'food-images');
DROP POLICY IF EXISTS "Merchants can upload food images" ON storage.objects;
CREATE POLICY "Merchants can upload food images" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'food-images'
        AND (auth.uid())::text = (storage.foldername(name)) [1]
    );
-- ADDED: UPDATE policy for upsert functionality
DROP POLICY IF EXISTS "Merchants can update food images" ON storage.objects;
CREATE POLICY "Merchants can update food images" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'food-images'
        AND (auth.uid())::text = (storage.foldername(name)) [1]
    );
DROP POLICY IF EXISTS "Merchants can delete own food images" ON storage.objects;
CREATE POLICY "Merchants can delete own food images" ON storage.objects FOR DELETE USING (
    bucket_id = 'food-images'
    AND (auth.uid())::text = (storage.foldername(name)) [1]
);
-- 2.5 Storage Policies for 'kyc-documents'
DROP POLICY IF EXISTS "Public can view kyc docs" ON storage.objects;
CREATE POLICY "Public can view kyc docs" ON storage.objects FOR
SELECT USING (bucket_id = 'kyc-documents');
DROP POLICY IF EXISTS "Merchants can upload kyc docs" ON storage.objects;
CREATE POLICY "Merchants can upload kyc docs" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'kyc-documents'
        AND (auth.uid())::text = (storage.foldername(name)) [1]
    );
-- ADDED: UPDATE policy for upsert functionality
DROP POLICY IF EXISTS "Merchants can update kyc docs" ON storage.objects;
CREATE POLICY "Merchants can update kyc docs" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'kyc-documents'
        AND (auth.uid())::text = (storage.foldername(name)) [1]
    );
DROP POLICY IF EXISTS "Merchants can delete own kyc docs" ON storage.objects;
CREATE POLICY "Merchants can delete own kyc docs" ON storage.objects FOR DELETE USING (
    bucket_id = 'kyc-documents'
    AND (auth.uid())::text = (storage.foldername(name)) [1]
);
-- 3. Enhance Merchants RLS
DROP POLICY IF EXISTS "Admins can update merchant verification" ON public.merchants;
CREATE POLICY "Admins can update merchant verification" ON public.merchants FOR
UPDATE USING (
        (auth.jwt()->'user_metadata'->>'role') = 'admin'
    ) WITH CHECK (
        (auth.jwt()->'user_metadata'->>'role') = 'admin'
    );
DROP POLICY IF EXISTS "Admins can view all merchants" ON public.merchants;
CREATE POLICY "Admins can view all merchants" ON public.merchants FOR
SELECT USING (
        (auth.jwt()->'user_metadata'->>'role') = 'admin'
    );
-- 4. Enhance Menu Items RLS
DROP POLICY IF EXISTS "Merchants can manage own menu" ON public.menu_items;
CREATE POLICY "Merchants can manage own menu" ON public.menu_items FOR ALL USING (merchant_id = auth.uid());
-- 5. KYC Review for Admin
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON public.kyc_documents;
CREATE POLICY "Admins can view all KYC documents" ON public.kyc_documents FOR
SELECT USING (
        (auth.jwt()->'user_metadata'->>'role') = 'admin'
    );