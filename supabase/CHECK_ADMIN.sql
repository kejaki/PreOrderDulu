-- LANGKAH 1: Cek apakah table profiles ada
SELECT EXISTS (
        SELECT
        FROM pg_tables
        WHERE schemaname = 'public'
            AND tablename = 'profiles'
    ) as profiles_table_exists;
-- LANGKAH 2: Cek total profiles
SELECT COUNT(*) as total_profiles
FROM profiles;
-- LANGKAH 3: Cek semua users dan profiles mereka
SELECT u.email,
    u.id,
    p.role,
    p.is_banned,
    CASE
        WHEN p.id IS NULL THEN 'NO PROFILE'
        ELSE 'HAS PROFILE'
    END as profile_status
FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
ORDER BY u.created_at DESC
LIMIT 10;
-- LANGKAH 4: Jika table profiles tidak ada, buat dulu:
-- (Uncomment jika table belum ada)
/*
 CREATE TABLE IF NOT EXISTS profiles (
 id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'merchant', 'super_admin')),
 is_banned BOOLEAN DEFAULT false,
 created_at TIMESTAMPTZ DEFAULT NOW(),
 updated_at TIMESTAMPTZ DEFAULT NOW()
 );
 */
-- LANGKAH 5: Set role super_admin untuk SEMUA user yang ada
-- (Uncomment untuk set semua user sebagai admin - HATI-HATI!)
/*
 INSERT INTO profiles (id, role, is_banned)
 SELECT id, 'super_admin', false
 FROM auth.users
 ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
 */