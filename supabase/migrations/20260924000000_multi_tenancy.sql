-- Phase 1: Multi-Tenancy Architecture

-- 1. Create Tenants Table
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  theme_color text DEFAULT '#0f172a',
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.tenants TO anon, authenticated;
CREATE POLICY "tenants are public" ON public.tenants FOR SELECT USING (true);

-- 2. Create Default Tenant
INSERT INTO public.tenants (id, name, slug) VALUES 
('00000000-0000-0000-0000-000000000001', 'Default University', 'default');

-- 3. Add tenant_id to all tables and set default
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
ALTER TABLE IF EXISTS public.user_roles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
ALTER TABLE IF EXISTS public.connections ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
ALTER TABLE IF EXISTS public.jobs ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
ALTER TABLE IF EXISTS public.mentorship_requests ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
ALTER TABLE IF EXISTS public.mentorship_messages ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
ALTER TABLE IF EXISTS public.events ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
ALTER TABLE IF EXISTS public.event_rsvps ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
ALTER TABLE IF EXISTS public.campaigns ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
ALTER TABLE IF EXISTS public.donations ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
ALTER TABLE IF EXISTS public.feed_posts ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
ALTER TABLE IF EXISTS public.feed_comments ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
ALTER TABLE IF EXISTS public.messages ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;

-- 4. Current Tenant Helper
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 5. Update RLS Policies to enforce tenant isolation
DROP POLICY IF EXISTS "verified profiles are public" ON public.profiles;
CREATE POLICY "tenant profiles visible to tenant" ON public.profiles FOR SELECT USING (tenant_id = public.current_tenant_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS "active jobs public" ON public.jobs;
CREATE POLICY "tenant jobs visible to tenant" ON public.jobs FOR SELECT USING (tenant_id = public.current_tenant_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS "events public" ON public.events;
CREATE POLICY "tenant events visible to tenant" ON public.events FOR SELECT USING (tenant_id = public.current_tenant_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Anyone can view businesses" ON public.businesses;
CREATE POLICY "tenant businesses visible to tenant" ON public.businesses FOR SELECT USING (tenant_id = public.current_tenant_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Anyone can view posts" ON public.feed_posts;
CREATE POLICY "tenant posts visible to tenant" ON public.feed_posts FOR SELECT USING (tenant_id = public.current_tenant_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS "campaigns public" ON public.campaigns;
CREATE POLICY "tenant campaigns visible to tenant" ON public.campaigns FOR SELECT USING (tenant_id = public.current_tenant_id() OR auth.role() = 'anon');
