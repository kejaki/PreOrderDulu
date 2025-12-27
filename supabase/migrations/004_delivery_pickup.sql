-- ============================================
-- Delivery vs Pickup Feature Migration
-- ============================================
-- Add columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup')),
    ADD COLUMN IF NOT EXISTS pickup_time TEXT;
-- Add comment for documentation
COMMENT ON COLUMN orders.order_type IS 'Type of order: delivery or pickup';
COMMENT ON COLUMN orders.pickup_time IS 'Preferred pickup time for pickup orders';
-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);