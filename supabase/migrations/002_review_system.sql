-- ============================================
-- Guest Rating System Migration
-- ============================================
-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_order_review UNIQUE (order_id)
);
-- 2. Add rating columns to merchants table
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS rating_average DECIMAL(3, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
-- 3. Create function to update merchant ratings
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
-- 4. Create trigger
DROP TRIGGER IF EXISTS on_review_inserted ON reviews;
CREATE TRIGGER on_review_inserted
AFTER
INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION update_merchant_rating();
-- 5. Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
-- 6. Create RLS policies
-- Allow anyone to view reviews
CREATE POLICY "Allow public read on reviews" ON reviews FOR
SELECT USING (true);
-- Only allow insert if order is completed
CREATE POLICY "Allow guest review on completed orders" ON reviews FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM orders
            WHERE orders.id = order_id
                AND orders.status = 'completed'
        )
    );
-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_reviews_merchant_id ON reviews(merchant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);