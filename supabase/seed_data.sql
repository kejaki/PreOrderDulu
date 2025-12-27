-- ============================================================================
-- SQL Seed Data: Manual Merchant Profile Creation
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Create a User in Supabase Authentication (or use an existing one).
-- 2. Copy the "User UID" from Supabase Dashboard -> Authentication.
-- 3. Replace 'REPLACE_WITH_YOUR_AUTH_UID' below with that UID.
-- 4. Run this script in Supabase SQL Editor.
-- ============================================================================
DO $$
DECLARE -- REPLACE THIS WITH YOUR ACTUAL SUPABASE AUTH USER ID
    v_user_id UUID := 'REPLACE_WITH_YOUR_AUTH_UID';
BEGIN -- 1. Insert Merchant Profile
INSERT INTO merchants (
        id,
        merchant_name,
        merchant_type,
        email,
        phone,
        latitude,
        longitude,
        address_text,
        is_open,
        is_verified,
        verification_status,
        business_description,
        profile_photo_url
    )
VALUES (
        v_user_id,
        'Nasi Goreng Mas Jaki (Demo)',
        'general',
        'demo@masjaki.com',
        '081234567890',
        -6.200000,
        -- Example Latitude (Jakarta)
        106.816666,
        -- Example Longitude (Jakarta)
        'Jl. Jendral Sudirman No. 1, Jakarta',
        true,
        -- Auto Open
        true,
        -- Auto Verified
        'approved',
        'Nasi Goreng Spesial dengan bumbu rahasia warisan leluhur. Tersedia berbagai varian toping.',
        'https://images.unsplash.com/photo-1603133872878-684f57fb0488?auto=format&fit=crop&q=80&w=1000' -- Dummy Image
    ) ON CONFLICT (id) DO
UPDATE
SET is_open = true,
    is_verified = true,
    verification_status = 'approved';
-- 2. Insert Menu Items for this Merchant
-- Item 1: Nasi Goreng Spesial
INSERT INTO menu_items (
        merchant_id,
        item_name,
        description,
        price,
        category,
        is_available,
        photo_url
    )
VALUES (
        v_user_id,
        'Nasi Goreng Spesial',
        'Nasi goreng dengan ayam, telur, bakso, dan sosis.',
        25000,
        'Makanan Berat',
        true,
        'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=300'
    );
-- Item 2: Mie Goreng Jowo
INSERT INTO menu_items (
        merchant_id,
        item_name,
        description,
        price,
        category,
        is_available,
        photo_url
    )
VALUES (
        v_user_id,
        'Mie Goreng Jowo',
        'Mie goreng bumbu kecap manis gurih khas Jawa.',
        22000,
        'Makanan Berat',
        true,
        'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=300'
    );
-- Item 3: Es Teh Manis
INSERT INTO menu_items (
        merchant_id,
        item_name,
        description,
        price,
        category,
        is_available,
        photo_url
    )
VALUES (
        v_user_id,
        'Es Teh Manis',
        'Teh manis dingin segar.',
        5000,
        'Minuman',
        true,
        'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=300'
    );
-- Item 4: Kerupuk
INSERT INTO menu_items (
        merchant_id,
        item_name,
        description,
        price,
        category,
        is_available,
        photo_url
    )
VALUES (
        v_user_id,
        'Kerupuk Putih',
        'Pelengkap makan.',
        2000,
        'Tambahan',
        true,
        NULL
    );
END $$;