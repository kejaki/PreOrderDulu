CREATE OR REPLACE FUNCTION public.get_top_products(p_merchant_id uuid, p_limit integer DEFAULT 5) RETURNS TABLE(
        id uuid,
        name text,
        sold_count bigint,
        image_url text
    ) LANGUAGE plpgsql AS $function$ BEGIN RETURN QUERY
SELECT mi.id,
    mi.item_name::text as name,
    -- Cast to text to match return type
    COALESCE(SUM(oi.quantity), 0)::BIGINT as sold_count,
    mi.photo_url as image_url
FROM menu_items mi
    LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
    LEFT JOIN orders o ON oi.order_id = o.id
WHERE mi.merchant_id = p_merchant_id
    AND (
        o.status = 'completed'
        OR o.status IS NULL
    ) -- Only count completed sales
GROUP BY mi.id,
    mi.item_name,
    mi.photo_url
ORDER BY sold_count DESC
LIMIT p_limit;
END;
$function$;