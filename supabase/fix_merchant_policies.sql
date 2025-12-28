-- FIX: RLS Policy untuk Merchants
-- Masalah: Super Admin tidak bisa approve/reject merchant karena belum ada policy-nya
-- 1. Function helper (pakai yang sudah ada atau buat baru jika belum)
CREATE OR REPLACE FUNCTION public.check_is_super_admin() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Tambahkan Policy UPDATE untuk Merchants
DROP POLICY IF EXISTS "Super admins can update any merchant" ON merchants;
CREATE POLICY "Super admins can update any merchant" ON merchants FOR
UPDATE USING (check_is_super_admin());
-- 3. Tambahkan Policy DELETE untuk Merchants
DROP POLICY IF EXISTS "Super admins can delete any merchant" ON merchants FOR DELETE USING (check_is_super_admin());
-- 4. Verifikasi
SELECT 'Merchant policies updated' as status;