-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE
    SET NULL,
        -- Optional link to order
        rating INTEGER NOT NULL CHECK (
            rating >= 1
            AND rating <= 5
        ),
        reviewer_name VARCHAR(255) NOT NULL,
        reviewer_email VARCHAR(255),
        -- Optional, good for verification
        comment TEXT,
        tags TEXT [],
        -- Array of strings for tags like ["Enak", "Murah"]
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
-- 3. Policies
-- Allow public (guests) to INSERT reviews
CREATE POLICY "Public can insert reviews" ON reviews FOR
INSERT WITH CHECK (true);
-- Allow public to SELECT reviews (to display on merchant page)
CREATE POLICY "Public can view reviews" ON reviews FOR
SELECT USING (true);
-- 4. RPC: Get Merchant Review Summary
-- Returns average rating, total count, and distribution
CREATE OR REPLACE FUNCTION get_merchant_review_summary(p_merchant_id UUID) RETURNS TABLE (
        average_rating NUMERIC,
        total_reviews BIGINT,
        rating_counts JSON
    ) AS $$ BEGIN RETURN QUERY
SELECT ROUND(AVG(rating)::numeric, 1) as average_rating,
    COUNT(*) as total_reviews,
    json_object_agg(grade, count) as rating_counts
FROM (
        SELECT rating as grade,
            COUNT(*) as count
        FROM reviews
        WHERE merchant_id = p_merchant_id
        GROUP BY rating
    ) sub;
END;
$$ LANGUAGE plpgsql STABLE;