-- 1. Get Merchant Key Metrics (Daily)
CREATE OR REPLACE FUNCTION get_merchant_stats(
        p_merchant_id UUID,
        p_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    ) RETURNS TABLE (
        total_revenue BIGINT,
        pending_orders BIGINT,
        completed_today BIGINT,
        avg_rating NUMERIC
    ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT -- Total Revenue Today (Sum of completed orders)
    COALESCE(SUM(total_amount), 0)::BIGINT as total_revenue,
    -- Pending Orders Count (All time pending)
    (
        SELECT COUNT(*)
        FROM orders
        WHERE merchant_id = p_merchant_id
            AND status = 'pending'
    )::BIGINT as pending_orders,
    -- Completed Orders Today Count
    COUNT(*) FILTER (
        WHERE status = 'completed'
    )::BIGINT as completed_today,
    -- Average Rating (All time)
    (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews
        WHERE merchant_id = p_merchant_id
    )::NUMERIC as avg_rating
FROM orders
WHERE merchant_id = p_merchant_id
    AND status = 'completed'
    AND created_at >= date_trunc('day', p_date)
    AND created_at < date_trunc('day', p_date) + interval '1 day';
END;
$$;
-- 2. Get Weekly Revenue Trend (Last 7 Days)
CREATE OR REPLACE FUNCTION get_weekly_revenue(p_merchant_id UUID) RETURNS TABLE (day_name TEXT, revenue BIGINT) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT to_char(day_series, 'Dy') as day_name,
    COALESCE(SUM(o.total_amount), 0)::BIGINT as revenue
FROM generate_series(
        NOW() - interval '6 days',
        NOW(),
        interval '1 day'
    ) as day_series
    LEFT JOIN orders o ON o.merchant_id = p_merchant_id
    AND o.status = 'completed'
    AND date_trunc('day', o.created_at) = date_trunc('day', day_series)
GROUP BY day_series
ORDER BY day_series ASC;
END;
$$;
-- 3. Get Top Products (Best Sellers)
CREATE OR REPLACE FUNCTION get_top_products(
        p_merchant_id UUID,
        p_limit INT DEFAULT 5
    ) RETURNS TABLE (
        id UUID,
        name TEXT,
        sold_count BIGINT,
        image_url TEXT
    ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT mi.id,
    mi.item_name as name,
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
$$;