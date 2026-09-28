-- Phase 7: mobile and push-notification readiness.
-- Tokens are opaque device identifiers; provider credentials stay in secrets.

CREATE TABLE public.device_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  push_token text NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, push_token)
);

CREATE TABLE public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'push', 'in_app')),
  template_key text NOT NULL,
  status text NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'suppressed')),
  provider_message_id text,
  error_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz
);

ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.device_registrations, public.notification_deliveries FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_registrations TO authenticated;

CREATE TRIGGER assign_tenant_on_device_registration BEFORE INSERT ON public.device_registrations
  FOR EACH ROW EXECUTE FUNCTION public.assign_current_tenant();
CREATE TRIGGER assign_tenant_on_notification_delivery BEFORE INSERT ON public.notification_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.assign_current_tenant();

CREATE POLICY "members manage own devices" ON public.device_registrations FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND profile_id = public.current_profile_id())
  WITH CHECK (tenant_id = public.current_tenant_id() AND profile_id = public.current_profile_id());
CREATE POLICY "members read own deliveries" ON public.notification_deliveries FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() AND profile_id = public.current_profile_id());
CREATE POLICY "tenant admins read deliveries" ON public.notification_deliveries FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin());
