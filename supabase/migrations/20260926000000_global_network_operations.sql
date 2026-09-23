-- Global network operations: chapters, trusted staff access, consent and measurable outcomes.
-- Apply after 20260925000000_production_hardening.sql.

CREATE TYPE public.chapter_member_role AS ENUM ('member', 'leader');
CREATE TYPE public.privacy_request_type AS ENUM ('export', 'delete');

CREATE TABLE public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  name text NOT NULL,
  slug text NOT NULL,
  city text,
  country text NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  description text,
  leader_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE public.chapter_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.chapter_member_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chapter_id, profile_id)
);

CREATE TABLE public.event_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  outcome_type text NOT NULL CHECK (outcome_type IN ('connection', 'mentor_match', 'job_lead', 'volunteer_interest', 'follow_up')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.communication_preferences (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  event_updates boolean NOT NULL DEFAULT true,
  opportunity_updates boolean NOT NULL DEFAULT true,
  chapter_updates boolean NOT NULL DEFAULT true,
  marketing_updates boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.privacy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type public.privacy_request_type NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE public.staff_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'admin',
  invited_by uuid NOT NULL REFERENCES public.profiles(id),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '14 days',
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER chapters_updated BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER communication_preferences_updated BEFORE UPDATE ON public.communication_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DO $$
DECLARE item text;
BEGIN
  FOREACH item IN ARRAY ARRAY['chapters', 'chapter_members', 'event_outcomes', 'communication_preferences', 'privacy_requests', 'staff_invitations', 'audit_events'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', item);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', item);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', item);
    EXECUTE format('CREATE TRIGGER assign_tenant_on_insert BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.assign_current_tenant()', item);
  END LOOP;
END $$;

CREATE POLICY "tenant chapters readable" ON public.chapters FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id() AND is_active);
CREATE POLICY "tenant admins manage chapters" ON public.chapters FOR ALL TO authenticated USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin()) WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin());
CREATE POLICY "tenant chapter members readable" ON public.chapter_members FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "members join chapters" ON public.chapter_members FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND profile_id = public.current_profile_id() AND role = 'member');
CREATE POLICY "members leave chapters" ON public.chapter_members FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND (profile_id = public.current_profile_id() OR public.is_tenant_admin()));
CREATE POLICY "tenant event outcomes readable" ON public.event_outcomes FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "members log event outcomes" ON public.event_outcomes FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND profile_id = public.current_profile_id());
CREATE POLICY "members manage preferences" ON public.communication_preferences FOR ALL TO authenticated USING (tenant_id = public.current_tenant_id() AND profile_id = public.current_profile_id()) WITH CHECK (tenant_id = public.current_tenant_id() AND profile_id = public.current_profile_id());
CREATE POLICY "members create privacy requests" ON public.privacy_requests FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND profile_id = public.current_profile_id());
CREATE POLICY "members read own privacy requests" ON public.privacy_requests FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id() AND (profile_id = public.current_profile_id() OR public.is_tenant_admin()));
CREATE POLICY "tenant admins resolve privacy requests" ON public.privacy_requests FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin()) WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin());
CREATE POLICY "tenant admins manage staff invitations" ON public.staff_invitations FOR ALL TO authenticated USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin()) WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin());
CREATE POLICY "tenant admins read audit trail" ON public.audit_events FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin());
