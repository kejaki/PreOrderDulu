-- Migration: Super Admin System with Role-Based Access Control
-- 1. Add role column to users (using user_metadata instead of direct column)
-- Note: In Supabase Auth, we store custom data in auth.users.raw_user_meta_data
-- We'll use a trigger to sync this to a profiles table for easier querying
-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'merchant', 'super_admin')),
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- RLS Policies for profiles
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
-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id, role)
VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 2. Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
-- RLS Policies for system_settings
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
-- Insert default settings
INSERT INTO system_settings (key, value)
VALUES ('maintenance_mode', '{"enabled": false}'::jsonb),
    (
        'global_announcement',
        '{"text": "", "enabled": false}'::jsonb
    ),
    ('platform_fee_percent', '{"value": 5}'::jsonb) ON CONFLICT (key) DO NOTHING;
-- 3. Set specific email as super_admin
-- NOTE: Replace 'ahmad.zaki@example.com' with your actual email
-- This creates a profile entry and updates the auth.users metadata
DO $$
DECLARE admin_user_id UUID;
BEGIN -- Get user ID by email
SELECT id INTO admin_user_id
FROM auth.users
WHERE email = 'ahmad.zaki@example.com';
IF admin_user_id IS NOT NULL THEN -- Insert or update profile
INSERT INTO profiles (id, role)
VALUES (admin_user_id, 'super_admin') ON CONFLICT (id) DO
UPDATE
SET role = 'super_admin';
-- Update user metadata
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb
WHERE id = admin_user_id;
END IF;
END $$;
-- 4. Create admin analytics RPC functions
-- Get platform stats
CREATE OR REPLACE FUNCTION get_platform_stats() RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
SELECT json_build_object(
        'total_users',
        (
            SELECT COUNT(*)
            FROM profiles
            WHERE role = 'user'
        ),
        'total_merchants',
        (
            SELECT COUNT(*)
            FROM merchants
        ),
        'total_active_orders',
        (
            SELECT COUNT(*)
            FROM orders
            WHERE status IN (
                    'pending',
                    'accepted',
                    'cooking',
                    'ready',
                    'delivering'
                )
        ),
        'total_revenue',
        (
            SELECT COALESCE(SUM(total_price), 0)
            FROM orders
            WHERE status = 'completed'
        )
    ) INTO result;
RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Get daily user registrations (last 30 days)
CREATE OR REPLACE FUNCTION get_daily_registrations() RETURNS TABLE(date DATE, count BIGINT) AS $$ BEGIN RETURN QUERY
SELECT DATE(created_at) as date,
    COUNT(*) as count
FROM profiles
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Get daily order volume (last 30 days)
CREATE OR REPLACE FUNCTION get_daily_order_volume() RETURNS TABLE(date DATE, count BIGINT) AS $$ BEGIN RETURN QUERY
SELECT DATE(created_at) as date,
    COUNT(*) as count
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;