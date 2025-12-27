-- ============================================================================
-- SQL: NEW RLS POLICIES & STORAGE BUCKETS
-- ============================================================================
-- 1. Create 'food-images' bucket for menu items
-- NOTE: In Supabase dashboard, you may need to create this manually if this SQL fails 
-- due to lack of extensions.
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-images', 'food-images', true) ON CONFLICT (id) DO NOTHING;
-- 2. Storage Policies for 'food-images'
CREATE POLICY "Public can view food images" ON storage.objects FOR
SELECT USING (bucket_id = 'food-images');
CREATE POLICY "Merchants can upload food images" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'food-images'
        AND (auth.uid())::text = (storage.foldername(name)) [1]
    );
CREATE POLICY "Merchants can delete own food images" ON storage.objects FOR DELETE USING (
    bucket_id = 'food-images'
    AND (auth.uid())::text = (storage.foldername(name)) [1]
);
-- 3. Enhance Merchants RLS
-- Allow admins to update any merchant
CREATE POLICY "Admins can update merchant verification" ON public.merchants FOR
UPDATE USING (
        auth.jwt()->'user_metadata'->>'role' = 'admin'
    ) WITH CHECK (
        auth.jwt()->'user_metadata'->>'role' = 'admin'
    );
-- 4. Enhance Menu Items RLS
-- Allow merchants to manage their own menu items
DROP POLICY IF EXISTS "Merchants can manage own menu" ON public.menu_items;
CREATE POLICY "Merchants can manage own menu" ON public.menu_items FOR ALL USING (merchant_id = auth.uid());
-- 5. KYC Review for Admin
-- Allow admin to view all KYC data
CREATE POLICY "Admins can view all KYC documents" ON public.kyc_documents FOR
SELECT USING (
        auth.jwt()->'user_metadata'->>'role' = 'admin'
    );
-- Allow admin to view all unverified merchants
CREATE POLICY "Admins can view all merchants" ON public.merchants FOR
SELECT USING (
        auth.jwt()->'user_metadata'->>'role' = 'admin'
    );