-- ============================================
-- Menu Variants & Multi-Categories Migration
-- ============================================
-- Add categories column (array of text for tags)
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS categories TEXT [] DEFAULT '{}';
-- Add options column (JSONB for variants/add-ons)
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb;
-- Add comments for documentation
COMMENT ON COLUMN menu_items.categories IS 'Array of category tags (e.g., ["Ayam", "Promo", "Pedas"])';
COMMENT ON COLUMN menu_items.options IS 'Variant options as JSON array: [{ name: "Level Pedas", required: true, choices: [{ label: "Level 1", price: 0 }] }]';
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_items_categories ON menu_items USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_menu_items_options ON menu_items USING GIN (options);