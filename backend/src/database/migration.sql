-- ============================================
-- AgriCore — Database Migration (Supabase/PostgreSQL)
-- Run this in the Supabase SQL editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
--  USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE NOT NULL,             -- Supabase Auth user ID
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'government')),
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
--  FARMERS TABLE (extends users for farmer role)
-- =============================================
CREATE TABLE IF NOT EXISTS farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    province TEXT NOT NULL,
    district TEXT NOT NULL,
    farm_size_hectares DECIMAL DEFAULT 0,

    -- Address fields
    address_line TEXT,
    town TEXT,
    postal_code TEXT,
    latitude DECIMAL,
    longitude DECIMAL,

    -- File references
    profile_image_url TEXT,
    id_document_url TEXT,
    farm_images JSONB DEFAULT '[]'::jsonb,

    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
--  LIVESTOCK TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS livestock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    animal_type TEXT NOT NULL,
    total INTEGER DEFAULT 0,
    born INTEGER DEFAULT 0,
    twins INTEGER DEFAULT 0,
    triplets INTEGER DEFAULT 0,
    sold INTEGER DEFAULT 0,
    consumed INTEGER DEFAULT 0,
    young INTEGER DEFAULT 0,
    last_dosed DATE,
    diseases TEXT[] DEFAULT '{}',
    treatment TEXT DEFAULT '',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
--  CROPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    hectares_planted DECIMAL DEFAULT 0,
    yield_tonnes DECIMAL DEFAULT 0,
    season TEXT,
    irrigation_type TEXT DEFAULT 'rainfed',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
--  SOIL DATA TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS soil_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    ph_level DECIMAL,
    nitrogen DECIMAL,
    phosphorus DECIMAL,
    potassium DECIMAL,
    organic_matter DECIMAL,
    soil_type TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
--  WEATHER HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS weather_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    temperature_min DECIMAL,
    temperature_max DECIMAL,
    rainfall DECIMAL DEFAULT 0,
    humidity_min DECIMAL,
    humidity_max DECIMAL,
    wind_speed DECIMAL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(farmer_id, date)     -- one record per farmer per day
);

-- =============================================
--  SUPPORT PLANS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS support_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_by_role TEXT NOT NULL CHECK (created_by_role IN ('farmer', 'government')),
    type TEXT NOT NULL,
    objectives TEXT,
    budget DECIMAL DEFAULT 0,
    timeline TEXT,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Active', 'Completed')),
    approval_status TEXT CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')),
    approved_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
--  INDEXES (performance)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_farmers_province ON farmers(province);
CREATE INDEX IF NOT EXISTS idx_farmers_district ON farmers(district);
CREATE INDEX IF NOT EXISTS idx_livestock_farmer_id ON livestock(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crops_farmer_id ON crops(farmer_id);
CREATE INDEX IF NOT EXISTS idx_soil_data_farmer_id ON soil_data(farmer_id);
CREATE INDEX IF NOT EXISTS idx_weather_farmer_date ON weather_history(farmer_id, date);
CREATE INDEX IF NOT EXISTS idx_plans_farmer_id ON support_plans(farmer_id);
CREATE INDEX IF NOT EXISTS idx_plans_created_by ON support_plans(created_by);

-- =============================================
--  HELPER FUNCTION: Append farm image URL
-- =============================================
CREATE OR REPLACE FUNCTION append_farm_image(p_farmer_id UUID, p_image_url TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE farmers
    SET farm_images = farm_images || to_jsonb(p_image_url)
    WHERE id = p_farmer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
--  ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_plans ENABLE ROW LEVEL SECURITY;

-- Users: can read own row
CREATE POLICY users_own_read ON users
    FOR SELECT USING (auth.uid() = auth_id);

-- Farmers: farmers see own data, gov sees all
CREATE POLICY farmers_own_read ON farmers
    FOR SELECT USING (
        user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'government')
    );

CREATE POLICY farmers_own_update ON farmers
    FOR UPDATE USING (
        user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    );

-- Livestock: same pattern
CREATE POLICY livestock_access ON livestock
    FOR SELECT USING (
        farmer_id IN (SELECT id FROM farmers WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'government')
    );

CREATE POLICY livestock_insert ON livestock
    FOR INSERT WITH CHECK (
        farmer_id IN (SELECT id FROM farmers WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
    );

-- Crops: same pattern
CREATE POLICY crops_access ON crops
    FOR SELECT USING (
        farmer_id IN (SELECT id FROM farmers WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'government')
    );

CREATE POLICY crops_insert ON crops
    FOR INSERT WITH CHECK (
        farmer_id IN (SELECT id FROM farmers WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
    );

-- Soil data: same pattern
CREATE POLICY soil_access ON soil_data
    FOR SELECT USING (
        farmer_id IN (SELECT id FROM farmers WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'government')
    );

-- Weather: same pattern
CREATE POLICY weather_access ON weather_history
    FOR SELECT USING (
        farmer_id IN (SELECT id FROM farmers WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'government')
    );

-- Support plans: farmers see own, gov sees all
CREATE POLICY plans_read ON support_plans
    FOR SELECT USING (
        farmer_id IN (SELECT id FROM farmers WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'government')
    );

CREATE POLICY plans_insert ON support_plans
    FOR INSERT WITH CHECK (
        created_by = (SELECT id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY plans_update ON support_plans
    FOR UPDATE USING (
        created_by = (SELECT id FROM users WHERE auth_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'government')
    );

-- =============================================
--  STORAGE BUCKET (run in Supabase dashboard)
-- =============================================
-- CREATE BUCKET 'agricore-files' with:
--   Public: false (private by default)
--   File size limit: 10MB
--   Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf
