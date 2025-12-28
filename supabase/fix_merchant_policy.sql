-- FIX: Allow Super Admin to manage merchants
-- Masalah: Super admin tidak punya hak akses UPDATE ke tabel merchants
-- 1. Buat Policy Update untuk merchants
CREATE POLICY "Super admins can manage all merchants" ON merchants FOR ALL USING (check_is_super_admin());
-- 2. Pastikan RLS enable (sudah pasti enable, tapi buat safety)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
-- 3. Cek hasil
SELECT 'Policy updated' as status;