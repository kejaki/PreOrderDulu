-- Quick Fix: Drop dan recreate policies untuk admin system
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can read system settings" ON system_settings;
DROP POLICY IF EXISTS "Only super admins can modify settings" ON system_settings;
-- Recreate policies untuk profiles
CREATE POLICY "Users can view own profile" ON profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Super admins can view all profiles" ON profiles FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'super_admin'
    )
);
-- Recreate policies untuk system_settings
CREATE POLICY "Anyone can read system settings" ON system_settings FOR
SELECT USING (true);
CREATE POLICY "Only super admins can modify settings" ON system_settings FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'super_admin'
    )
);
-- Set your email as super admin (GANTI EMAIL INI!)
INSERT INTO profiles (id, role)
SELECT id,
    'super_admin'
FROM auth.users
WHERE email = 'GANTI_DENGAN_EMAIL_ANDA@example.com' ON CONFLICT (id) DO
UPDATE
SET role = 'super_admin';