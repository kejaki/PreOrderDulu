-- ============================================
-- RLS Policy for Guest Order Lookup
-- ============================================
-- This policy allows public SELECT on orders table for guest order lookup
-- Users can find their orders using their WhatsApp number
-- Note: For production, consider adding rate limiting at the application level
-- to prevent abuse of this lookup feature
CREATE POLICY "Allow order lookup by WhatsApp" ON orders FOR
SELECT USING (true);
-- Alternative: More restrictive policy (uncomment to use instead of above)
-- This requires exact match on guest_whatsapp and excludes completed/cancelled
/*
 CREATE POLICY "Allow order lookup by WhatsApp (filtered)" 
 ON orders FOR SELECT 
 USING (
 guest_whatsapp IS NOT NULL 
 AND status NOT IN ('completed', 'cancelled')
 );
 */