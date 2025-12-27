-- Function to search merchants by name OR menu item name
-- Sorted by distance from user
CREATE OR REPLACE FUNCTION search_merchants_and_menus(
        p_lat FLOAT,
        p_lng FLOAT,
        p_search_text TEXT,
        p_radius_meters INT DEFAULT 5000
    ) RETURNS TABLE (
        id UUID,
        name TEXT,
        address TEXT,
        phone TEXT,
        is_open BOOLEAN,
        latitude FLOAT,
        longitude FLOAT,
        rating FLOAT,
        logo_url TEXT,
        distance_meters FLOAT
    ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT DISTINCT m.id,
    m.merchant_name AS name,
    m.merchant_address AS address,
    m.phone_number AS phone,
    m.is_open,
    m.latitude,
    m.longitude,
    m.rating,
    m.photo_url AS logo_url,
    -- Calculate distance using Haversine formula (approximate) or PostGIS if available
    -- Here we use a standard earth radius calculation for compatibility without PostGIS extension if not enabled
    (
        6371000 * acos(
            cos(radians(p_lat)) * cos(radians(m.latitude)) * cos(radians(m.longitude) - radians(p_lng)) + sin(radians(p_lat)) * sin(radians(m.latitude))
        )
    ) AS distance_meters
FROM merchants m
    LEFT JOIN menu_items mi ON m.id = mi.merchant_id
WHERE m.is_open = true
    AND (
        m.merchant_name ILIKE '%' || p_search_text || '%'
        OR mi.item_name ILIKE '%' || p_search_text || '%'
    )
    AND (
        (
            6371000 * acos(
                cos(radians(p_lat)) * cos(radians(m.latitude)) * cos(radians(m.longitude) - radians(p_lng)) + sin(radians(p_lat)) * sin(radians(m.latitude))
            )
        ) <= p_radius_meters
    )
ORDER BY distance_meters ASC;
END;
$$;