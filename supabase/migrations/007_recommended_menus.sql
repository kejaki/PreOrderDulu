-- Function to get random recommended menu items
CREATE OR REPLACE FUNCTION get_recommended_menus(limit_count INT DEFAULT 10) RETURNS TABLE (
        id UUID,
        name TEXT,
        price INT,
        image_url TEXT,
        merchant_id UUID,
        merchant_name TEXT,
        description TEXT
    ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT mi.id,
    mi.item_name AS name,
    mi.price,
    mi.photo_url AS image_url,
    mi.merchant_id,
    m.merchant_name,
    mi.description
FROM menu_items mi
    JOIN merchants m ON mi.merchant_id = m.id
WHERE mi.is_available = true -- AND m.is_open = true -- Relaxed for testing
ORDER BY RANDOM()
LIMIT limit_count;
END;
$$;