-- FIX: Infinite Recursion pada RLS Policy
-- Masalah: Policy "Super admins can view all profiles" melakukan query ke table profiles lagi -> Loop -> Error 500
-- 1. Buat helper function yang aman (Security Definer)
-- Function ini berjalan sebagai pemilik database, jadi membypass RLS untuk pengecekan
CREATE OR REPLACE FUNCTION public.check_is_super_admin() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Update Policy profiles
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
CREATE POLICY "Super admins can view all profiles" ON profiles FOR ALL USING (
    -- Gunakan function baru, bukan query langsung
    check_is_super_admin()
);
-- 3. Update Policy system_settings (biar aman juga)
DROP POLICY IF EXISTS "Only super admins can modify settings" ON system_settings;
CREATE POLICY "Only super admins can modify settings" ON system_settings FOR ALL USING (check_is_super_admin());
-- 4. Verifikasi
SELECT 'Fixed policies' as status;