-- FIX: Admin Stats RPC Permission (Correct Column Name)
-- Masalah: Error "column total_price does not exist" -> ganti ke "total_amount"
-- 1. Drop fungsi lama
DROP FUNCTION IF EXISTS get_platform_stats();
-- 2. Buat ulang dengan nama kolom yang benar (total_amount)
CREATE OR REPLACE FUNCTION get_platform_stats() RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
SELECT json_build_object(
        'total_users',
        (
            SELECT count(*)
            FROM profiles
            WHERE role = 'user'
        ),
        'total_merchants',
        (
            SELECT count(*)
            FROM merchants
        ),
        'total_active_orders',
        (
            SELECT count(*)
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
            SELECT COALESCE(SUM(total_amount), 0)
            FROM orders
            WHERE status = 'completed'
        )
    ) INTO result;
RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Berikan akses execute ke authenticated users
GRANT EXECUTE ON FUNCTION get_platform_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_stats() TO service_role;
-- 4. Verifikasi
SELECT get_platform_stats();