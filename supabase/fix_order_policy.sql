-- FIX: Allow Super Admin to view orders
-- Masalah: Admin tidak bisa lihat data orders (dan error 400 saat join) karena tidak ada RLS Policy
-- 1. Buat Policy Select untuk orders
DROP POLICY IF EXISTS "Super admins can view all orders" ON orders;
CREATE POLICY "Super admins can view all orders" ON orders FOR
SELECT USING (check_is_super_admin());
-- 2. Buat Policy untuk Order Items juga (jika nanti dibutuhkan detail)
DROP POLICY IF EXISTS "Super admins can view all order items" ON order_items;
CREATE POLICY "Super admins can view all order items" ON order_items FOR
SELECT USING (check_is_super_admin());
-- 3. Verifikasi
SELECT 'Orders policy updated' as status;