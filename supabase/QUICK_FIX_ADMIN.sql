-- QUICK FIX: Set semua user yang login sebagai super_admin
-- 1. Buat table profiles (jika belum ada)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'merchant', 'super_admin')),
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Set SEMUA user yang ada sebagai super_admin
INSERT INTO profiles (id, role, is_banned)
SELECT id,
    'super_admin',
    false
FROM auth.users ON CONFLICT (id) DO
UPDATE
SET role = 'super_admin',
    is_banned = false;
-- 3. Verify
SELECT u.email,
    p.role,
    CASE
        WHEN p.role = 'super_admin' THEN '✅ ADMIN ACCESS'
        ELSE '❌ NO ACCESS'
    END as access_status
FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id;