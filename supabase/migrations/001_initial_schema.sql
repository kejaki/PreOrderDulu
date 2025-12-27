-- Enable PostGIS extension for geolocation queries
CREATE EXTENSION IF NOT EXISTS postgis;
-- ============================================
-- TABLE: merchants
-- ============================================
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Basic Info
    merchant_name VARCHAR(255) NOT NULL,
    merchant_type VARCHAR(20) NOT NULL CHECK (merchant_type IN ('student', 'general')),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    -- Location (for geolocation sorting)
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address_text TEXT NOT NULL,
    -- Store Status
    is_open BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (
        verification_status IN ('pending', 'approved', 'rejected')
    ),
    -- Student-specific fields (nullable for general merchants)
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    -- Metadata
    profile_photo_url TEXT,
    business_description TEXT,
    -- Geolocation column (PostGIS GEOGRAPHY type)
    location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    ) STORED
);
-- Indexes for fast queries
CREATE INDEX idx_merchants_location ON merchants USING GIST(location);
CREATE INDEX idx_merchants_is_open ON merchants(is_open);
CREATE INDEX idx_merchants_type ON merchants(merchant_type);
CREATE INDEX idx_merchants_verification ON merchants(verification_status);
-- ============================================
-- TABLE: kyc_documents
-- ============================================
CREATE TABLE kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Document Type
    document_type VARCHAR(50) NOT NULL CHECK (
        document_type IN (
            'ktm',
            -- Student ID (required for students)
            'class_schedule',
            -- Academic data (required for students)
            'ktp',
            -- National ID (required for general, optional for students)
            'ktp_selfie',
            -- Selfie with KTP (required for general)
            'business_photo' -- Kitchen/business photo (required for general)
        )
    ),
    -- Storage
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    rejection_reason TEXT
);
CREATE INDEX idx_kyc_merchant ON kyc_documents(merchant_id);
CREATE INDEX idx_kyc_type ON kyc_documents(document_type);
-- ============================================
-- TABLE: menu_items
-- ============================================
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Item Details
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    -- Inventory
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    is_available BOOLEAN DEFAULT true,
    -- Media
    photo_url TEXT,
    -- Category (optional for filtering)
    category VARCHAR(100)
);
CREATE INDEX idx_menu_merchant ON menu_items(merchant_id);
CREATE INDEX idx_menu_available ON menu_items(is_available);
CREATE INDEX idx_menu_category ON menu_items(category);
-- ============================================
-- TABLE: orders
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Guest Information (no account required)
    guest_name VARCHAR(255) NOT NULL,
    guest_whatsapp VARCHAR(20) NOT NULL,
    guest_address_text TEXT NOT NULL,
    guest_latitude DECIMAL(10, 8),
    guest_longitude DECIMAL(11, 8),
    guest_notes TEXT,
    -- Order Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            -- Waiting for merchant to accept
            'accepted',
            -- Merchant accepted
            'cooking',
            -- Being prepared
            'ready',
            -- Ready for delivery
            'delivering',
            -- Out for delivery
            'completed',
            -- Delivered
            'rejected',
            -- Merchant rejected
            'cancelled' -- Cancelled by buyer
        )
    ),
    -- Payment
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cod', 'qris')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    -- Unique tracking link
    tracking_token VARCHAR(100) UNIQUE NOT NULL,
    -- Timestamps for tracking
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ
);
CREATE INDEX idx_orders_merchant ON orders(merchant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_tracking ON orders(tracking_token);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_guest_wa ON orders(guest_whatsapp);
-- ============================================
-- TABLE: order_items
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE
    SET NULL,
        -- Snapshot of item at time of order
        item_name VARCHAR(255) NOT NULL,
        item_price DECIMAL(10, 2) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        subtotal DECIMAL(10, 2) NOT NULL,
        -- Notes for this specific item
        item_notes TEXT
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
-- ============================================
-- RPC FUNCTION: get_nearby_merchants
-- ============================================
CREATE OR REPLACE FUNCTION get_nearby_merchants(
        user_lat DOUBLE PRECISION,
        user_lng DOUBLE PRECISION,
        max_distance INTEGER DEFAULT 5000
    ) RETURNS TABLE (
        id UUID,
        merchant_name VARCHAR,
        merchant_type VARCHAR,
        latitude DECIMAL,
        longitude DECIMAL,
        address_text TEXT,
        is_open BOOLEAN,
        is_verified BOOLEAN,
        profile_photo_url TEXT,
        business_description TEXT,
        distance_meters DOUBLE PRECISION
    ) AS $$ BEGIN RETURN QUERY
SELECT m.id,
    m.merchant_name,
    m.merchant_type,
    m.latitude,
    m.longitude,
    m.address_text,
    m.is_open,
    m.is_verified,
    m.profile_photo_url,
    m.business_description,
    ST_Distance(
        m.location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)
    ) AS distance_meters
FROM merchants m
WHERE m.is_open = true
    AND m.is_verified = true
    AND ST_DWithin(
        m.location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326),
        max_distance
    )
ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- Merchants Policies
CREATE POLICY "Public can view open verified merchants" ON merchants FOR
SELECT USING (
        is_open = true
        AND is_verified = true
    );
CREATE POLICY "Merchants can view own data" ON merchants FOR ALL USING (auth.uid() = id);
-- KYC Documents Policies  
CREATE POLICY "Merchants can manage own KYC docs" ON kyc_documents FOR ALL USING (merchant_id = auth.uid());
-- Menu Items Policies
CREATE POLICY "Public can view available menu items" ON menu_items FOR
SELECT USING (
        is_available = true
        AND EXISTS (
            SELECT 1
            FROM merchants
            WHERE merchants.id = menu_items.merchant_id
                AND merchants.is_open = true
                AND merchants.is_verified = true
        )
    );
CREATE POLICY "Merchants can manage own menu" ON menu_items FOR ALL USING (merchant_id = auth.uid());
-- Orders Policies
CREATE POLICY "Public can create orders" ON orders FOR
INSERT WITH CHECK (true);
CREATE POLICY "Public can view orders by tracking token" ON orders FOR
SELECT USING (true);
CREATE POLICY "Merchants can view and update own orders" ON orders FOR ALL USING (merchant_id = auth.uid());
-- Order Items Policies
CREATE POLICY "Public can create order items" ON order_items FOR
INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view order items" ON order_items FOR
SELECT USING (true);
-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_merchants_updated_at BEFORE
UPDATE ON merchants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE
UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE
UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================
-- AUTOMATIC MERCHANT PROFILE TRIGGER
-- ============================================
-- This trigger creates a skeleton merchant record 
-- when a user signs up in Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_merchant() RETURNS TRIGGER AS $$ BEGIN -- We check the 'role' metadata we sent from the registration form
    IF (new.raw_user_meta_data->>'role' = 'merchant') THEN
INSERT INTO public.merchants (
        id,
        merchant_name,
        merchant_type,
        email,
        phone,
        latitude,
        longitude,
        address_text
    )
VALUES (
        new.id,
        COALESCE(
            new.raw_user_meta_data->>'full_name',
            'New Merchant'
        ),
        'general',
        -- Default
        new.email,
        '000',
        -- Placeholder to be updated by form
        0,
        -- Placeholder
        0,
        -- Placeholder
        'Address to be updated' -- Placeholder
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_merchant();