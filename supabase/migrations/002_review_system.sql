-- ============================================
-- 1. Update merchants table
-- ============================================
ALTER TABLE merchants
ADD COLUMN rating_average DECIMAL(3, 2) DEFAULT 0,
    ADD COLUMN rating_count INTEGER DEFAULT 0;
-- ============================================
-- 2. Create reviews table
-- ============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure one review per order
    CONSTRAINT unique_order_review UNIQUE (order_id)
);
CREATE INDEX idx_reviews_merchant ON reviews(merchant_id);
CREATE INDEX idx_reviews_order ON reviews(order_id);
-- ============================================
-- 3. Trigger Function for Rating Recalculation
-- ============================================
CREATE OR REPLACE FUNCTION update_merchant_rating() RETURNS TRIGGER AS $$ BEGIN
UPDATE merchants
SET rating_average = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM reviews
        WHERE merchant_id = NEW.merchant_id
    ),
    rating_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE merchant_id = NEW.merchant_id
    )
WHERE id = NEW.merchant_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_review_inserted
AFTER
INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION update_merchant_rating();
-- ============================================
-- 4. RLS Policies
-- ============================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
-- Allow anyone to view reviews (for public display)
CREATE POLICY "Anyone can view reviews" ON reviews FOR
SELECT USING (true);
-- Allow insertion ONLY if the order is 'completed'
CREATE POLICY "Allow guest review on completed orders" ON reviews FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM orders
            WHERE orders.id = order_id
                AND orders.status = 'completed'
        )
    );