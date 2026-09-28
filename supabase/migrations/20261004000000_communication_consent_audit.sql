CREATE TABLE public.communication_consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preference_key text NOT NULL CHECK (preference_key IN ('event_updates','opportunity_updates','chapter_updates','marketing_updates')),
  granted boolean NOT NULL, source text NOT NULL DEFAULT 'member_settings', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX communication_consent_profile_created_idx ON public.communication_consent_events (tenant_id, profile_id, created_at DESC);
ALTER TABLE public.communication_consent_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.communication_consent_events FROM anon;
GRANT SELECT, INSERT ON public.communication_consent_events TO authenticated;
CREATE TRIGGER assign_tenant_on_communication_consent_event BEFORE INSERT ON public.communication_consent_events FOR EACH ROW EXECUTE FUNCTION public.assign_current_tenant();
CREATE POLICY "members read own consent history" ON public.communication_consent_events FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id() AND profile_id = public.current_profile_id());
CREATE POLICY "members record own consent" ON public.communication_consent_events FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND profile_id = public.current_profile_id());
CREATE POLICY "tenant admins read consent history" ON public.communication_consent_events FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin());
