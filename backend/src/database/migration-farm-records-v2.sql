-- ============================================
-- AgriCore — Farm Records + Analytics v2
-- Adds period-based farmer records, backend analytics,
-- and weather snapshot linkage to records.
-- ============================================

DO $$
BEGIN
  IF to_regclass('public.farmers') IS NULL OR to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'Required tables missing. Run base migrations first.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS farm_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  province TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  crop_yield NUMERIC NOT NULL DEFAULT 0,
  livestock_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT farm_records_valid_period CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_farm_records_user_created_at ON farm_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_farm_records_farmer_period ON farm_records(farmer_id, start_date, end_date);

CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  province TEXT,
  performance_score INTEGER NOT NULL DEFAULT 0 CHECK (performance_score >= 0 AND performance_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_province ON analytics(province);
CREATE INDEX IF NOT EXISTS idx_analytics_risk_level ON analytics(risk_level);

ALTER TABLE public.weather_history
  ADD COLUMN IF NOT EXISTS farm_record_id UUID REFERENCES public.farm_records(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_weather_history_farm_record_id ON public.weather_history(farm_record_id);
