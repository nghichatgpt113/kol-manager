-- ==============================================================================
-- KOL MANAGER - DATABASE SCHEMA SPECIFICATION (REVISED & HARDENED)
-- ==============================================================================
-- NOTE: THIS SCRIPT IS FOR REVIEW PURPOSES ONLY. DO NOT EXECUTE DIRECTLY YET.
-- Target: PostgreSQL (v15+) / Supabase
--
-- Key Enhancements in this Revision:
-- 1. Enforced same-owner foreign keys: (kol_id, user_id), (product_id, user_id),
--    and (campaign_id, user_id) reference parent tables to eliminate cross-user relations.
-- 2. Audit-only status history: Client INSERT/UPDATE/DELETE revoked; only SECURITY DEFINER
--    trigger can write history.
-- 3. Data validation CHECK constraints on rates, fees, counts, and amounts.
-- 4. Safe migration idempotency (DROP TRIGGER/POLICY IF EXISTS before create).
-- 5. Backfill script documented for existing auth users.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- EXTENSIONS & HELPER FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update the 'updated_at' timestamp column
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. TABLE: PROFILES (Extends auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Trigger to automatically insert a profile row when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- NOTE: For existing auth users created prior to the trigger, run this one-time backfill:
-- INSERT INTO public.profiles (id, full_name, avatar_url)
-- SELECT
--   id,
--   COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email),
--   raw_user_meta_data->>'avatar_url'
-- FROM auth.users
-- ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. TABLE: KOLS (KOL/KOC directory)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'tiktok',
  channel_url TEXT,
  display_name TEXT,
  contact_phone TEXT,
  contact_zalo TEXT,
  contact_email TEXT,
  address TEXT,
  followers_count INTEGER DEFAULT 0 CHECK (followers_count >= 0),
  niche TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_kols_user_platform_username UNIQUE (user_id, platform, username),
  CONSTRAINT uq_kols_id_user_id UNIQUE (id, user_id)
);

DROP TRIGGER IF EXISTS trigger_kols_updated_at ON public.kols;
CREATE TRIGGER trigger_kols_updated_at
  BEFORE UPDATE ON public.kols
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 3. TABLE: PRODUCTS (Product Catalog & Defaults)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  sku TEXT,
  product_url TEXT,
  affiliate_link TEXT,
  sample_cost NUMERIC(15,2) DEFAULT 0 CHECK (sample_cost >= 0),
  default_commission_rate NUMERIC(5,2) DEFAULT 0 CHECK (default_commission_rate >= 0 AND default_commission_rate <= 100),
  default_ads_rate NUMERIC(5,2) DEFAULT 0 CHECK (default_ads_rate >= 0 AND default_ads_rate <= 100),
  description TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_products_id_user_id UNIQUE (id, user_id)
);

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 4. TABLE: CAMPAIGNS (Monthly / Event Campaigns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  month INTEGER CHECK (month >= 1 AND month <= 12),
  year INTEGER CHECK (year >= 2020),
  budget NUMERIC(15,2) DEFAULT 0 CHECK (budget >= 0),
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planning', 'active', 'completed', 'paused')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_campaigns_id_user_id UNIQUE (id, user_id)
);

DROP TRIGGER IF EXISTS trigger_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER trigger_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 5. TABLE: BOOKINGS (Core Operational Collaboration Entity)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kol_id UUID NOT NULL,
  product_id UUID,
  campaign_id UUID,
  code TEXT,
  content_type TEXT,
  booking_fee NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (booking_fee >= 0),
  commission_rate NUMERIC(5,2) DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  ads_rate NUMERIC(5,2) DEFAULT 0 CHECK (ads_rate >= 0 AND ads_rate <= 100),
  status TEXT NOT NULL DEFAULT 'contacted' CHECK (
    status IN (
      'contacted',
      'confirmed',
      'sample_sent',
      'sample_delivered',
      'draft_submitted',
      'posted',
      'completed',
      'cancelled'
    )
  ),
  -- Sample logistics
  sample_product_notes TEXT,
  sample_sent_at TIMESTAMPTZ,
  sample_expected_at DATE,
  sample_delivered_at TIMESTAMPTZ,
  sample_tracking_code TEXT,
  sample_carrier TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  recipient_address TEXT,
  -- Timelines
  video_reminder_at DATE,
  expected_post_at DATE,
  -- Payment
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid')),
  paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Composite Unique constraint for children FK referencing
  CONSTRAINT uq_bookings_id_user_id UNIQUE (id, user_id),
  -- SAME-OWNER FOREIGN KEYS: Guarantees at database level that child belongs to the same user
  CONSTRAINT fk_bookings_kol_same_user FOREIGN KEY (kol_id, user_id)
    REFERENCES public.kols(id, user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_product_same_user FOREIGN KEY (product_id, user_id)
    REFERENCES public.products(id, user_id) ON DELETE SET NULL (product_id),
  CONSTRAINT fk_bookings_campaign_same_user FOREIGN KEY (campaign_id, user_id)
    REFERENCES public.campaigns(id, user_id) ON DELETE SET NULL (campaign_id)
);

DROP TRIGGER IF EXISTS trigger_bookings_updated_at ON public.bookings;
CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 6. TABLE: BOOKING_STATUS_HISTORY (Audit-Only Log for Status Changes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to automatically track status changes in booking_status_history
CREATE OR REPLACE FUNCTION public.log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.booking_status_history (booking_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, (SELECT auth.uid()));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_log_booking_status ON public.bookings;
CREATE TRIGGER trigger_log_booking_status
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_booking_status_change();

-- ------------------------------------------------------------------------------
-- 7. TABLE: VIDEOS (Published Videos, Air Links & Spark Ads Codes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  video_url TEXT,
  video_id TEXT,
  title TEXT,
  air_url TEXT,
  ads_code TEXT,
  ads_code_expires_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trigger_videos_updated_at ON public.videos;
CREATE TRIGGER trigger_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 8. TABLE: TASKS (Reminders & Action Items)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (
    type IN (
      'sample_delivery_check',
      'video_reminder',
      'draft_review',
      'get_air_link',
      'get_ads_code',
      'payment',
      'general'
    )
  ),
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- SAME-OWNER FK: If a task is linked to a booking, both must share the same user_id
  CONSTRAINT fk_tasks_booking_same_user FOREIGN KEY (booking_id, user_id)
    REFERENCES public.bookings(id, user_id) ON DELETE CASCADE
);

DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON public.tasks;
CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 9. TABLE: TEMPLATES (Message / Outreach Templates)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'invitation' CHECK (
    category IN (
      'invitation',
      'confirmation',
      'brief',
      'sample_sent',
      'video_reminder',
      'ads_code_request',
      'feedback',
      'general'
    )
  ),
  content TEXT NOT NULL,
  variables_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trigger_templates_updated_at ON public.templates;
CREATE TRIGGER trigger_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- INDEXES STRATEGY
-- ==============================================================================

-- Foreign Key & Composite Lookup Indexes (Essential for joins & cascades)
CREATE INDEX IF NOT EXISTS idx_kols_user_id ON public.kols(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_kol_composite ON public.bookings(kol_id, user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_product_composite ON public.bookings(product_id, user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_campaign_composite ON public.bookings(campaign_id, user_id);

CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking_id ON public.booking_status_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_videos_booking_id ON public.videos(booking_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_booking_composite ON public.tasks(booking_id, user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);

-- Operational Query Indexes
CREATE INDEX IF NOT EXISTS idx_kols_lookup ON public.kols(user_id, platform, username);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_timeline ON public.bookings(user_id, expected_post_at);
CREATE INDEX IF NOT EXISTS idx_tasks_timeline ON public.tasks(user_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_videos_ads_code ON public.videos(ads_code) WHERE ads_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_videos_ads_expiration ON public.videos(ads_code_expires_at) WHERE ads_code_expires_at IS NOT NULL;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

-- 2. KOLs Policies
DROP POLICY IF EXISTS "Users can manage own kols" ON public.kols;
CREATE POLICY "Users can manage own kols"
  ON public.kols FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 3. Products Policies
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;
CREATE POLICY "Users can manage own products"
  ON public.products FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4. Campaigns Policies
DROP POLICY IF EXISTS "Users can manage own campaigns" ON public.campaigns;
CREATE POLICY "Users can manage own campaigns"
  ON public.campaigns FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 5. Bookings Policies
DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;
CREATE POLICY "Users can manage own bookings"
  ON public.bookings FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 6. Booking Status History Policies (AUDIT-ONLY: SELECT only for clients, NO client INSERT/UPDATE/DELETE)
DROP POLICY IF EXISTS "Users can view status history of own bookings" ON public.booking_status_history;
CREATE POLICY "Users can view status history of own bookings"
  ON public.booking_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_status_history.booking_id
        AND bookings.user_id = (SELECT auth.uid())
    )
  );

-- Note: No INSERT, UPDATE, or DELETE policy is granted on booking_status_history to authenticated users.
-- Only the SECURITY DEFINER trigger log_booking_status_change() writes to this table.

-- 7. Videos Policies (Inherited via bookings)
DROP POLICY IF EXISTS "Users can manage videos of own bookings" ON public.videos;
CREATE POLICY "Users can manage videos of own bookings"
  ON public.videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = videos.booking_id
        AND bookings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = videos.booking_id
        AND bookings.user_id = (SELECT auth.uid())
    )
  );

-- 8. Tasks Policies
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
CREATE POLICY "Users can manage own tasks"
  ON public.tasks FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 9. Templates Policies
DROP POLICY IF EXISTS "Users can manage own templates" ON public.templates;
CREATE POLICY "Users can manage own templates"
  ON public.templates FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
