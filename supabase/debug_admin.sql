-- Debug Script: Check Admin Setup
-- 1. Check if profiles table exists and has data
SELECT 'Profiles Table Check' as check_name,
    COUNT(*) as total_profiles
FROM profiles;
-- 2. Check your user and role
SELECT 'Your User Info' as check_name,
    email,
    id,
    created_at
FROM auth.users
WHERE email = 'GANTI_EMAIL_ANDA@example.com';
-- 3. Check if profile exists for your user
SELECT 'Your Profile' as check_name,
    p.id,
    p.role,
    p.is_banned,
    u.email
FROM profiles p
    JOIN auth.users u ON u.id = p.id
WHERE u.email = 'GANTI_EMAIL_ANDA@example.com';
-- 4. If no profile, create it manually
-- Uncomment and run this if profile doesn't exist:
/*
 INSERT INTO profiles (id, role, is_banned)
 SELECT id, 'super_admin', false
 FROM auth.users
 WHERE email = 'GANTI_EMAIL_ANDA@example.com'
 ON CONFLICT (id) DO UPDATE 
 SET role = 'super_admin', is_banned = false;
 */