-- FIX: Grant Execute to Admin Helper
-- Masalah: Kadang fungsi helper butuh explicit grant agar bisa dipanggil oleh user (via RLS)
GRANT EXECUTE ON FUNCTION public.check_is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_super_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_is_super_admin() TO anon;
-- Just in case needed for login checks (though unlikely for admin)
-- Update juga function stats biar aman
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO service_role;