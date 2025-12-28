-- Migration: Enhanced Menu Items with Multi-Media and Customization Options
-- 1. Add new columns to menu_items
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS images TEXT [],
    -- Multiple images
ADD COLUMN IF NOT EXISTS video_url TEXT,
    -- Single video
ADD COLUMN IF NOT EXISTS customization_options JSONB DEFAULT '[]'::jsonb;
-- Customization options
-- 2. Example customization_options structure:
-- [
--   {
--     "id": "ice_level",
--     "label": "Tingkat Es",
--     "type": "select",
--     "required": false,
--     "options": ["Tanpa Es", "Es Sedikit", "Es Normal", "Es Banyak"]
--   },
--   {
--     "id": "spice_level",
--     "label": "Tingkat Pedas",
--     "type": "select",
--     "required": true,
--     "options": ["Tidak Pedas", "Sedang", "Pedas", "Extra Pedas"]
--   },
--   {
--     "id": "extras",
--     "label": "Tambahan",
--     "type": "checkbox",
--     "required": false,
--     "options": ["Extra Keju", "Extra Sayur", "Extra Sambal"]
--   }
-- ]
-- Note: Keep image_url for backward compatibility (will be primary/thumbnail image)