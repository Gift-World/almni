-- Phase 6: provider-neutral CRM/SIS integration operations.
-- Credentials are never stored in this table; keep provider secrets in the
-- deployment secret manager and store only a secret reference here.

CREATE TYPE public.integration_provider AS ENUM ('salesforce', 'raisers_edge', 'banner', 'workday', 'custom');
CREATE TYPE public.integration_state AS ENUM ('draft', 'active', 'paused', 'error');

CREATE TABLE public.integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider public.integration_provider NOT NULL,
  display_name text NOT NULL,
  state public.integration_state NOT NULL DEFAULT 'draft',
  secret_reference text,
  field_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider, display_name)
);

CREATE TABLE public.integration_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES public.integration_connections(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  records_read integer NOT NULL DEFAULT 0 CHECK (records_read >= 0),
  records_written integer NOT NULL DEFAULT 0 CHECK (records_written >= 0),
  error_summary text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER integration_connections_updated
  BEFORE UPDATE ON public.integration_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_sync_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.integration_connections, public.integration_sync_runs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_connections, public.integration_sync_runs TO authenticated;

CREATE TRIGGER assign_tenant_on_integration_connection
  BEFORE INSERT ON public.integration_connections
  FOR EACH ROW EXECUTE FUNCTION public.assign_current_tenant();
CREATE TRIGGER assign_tenant_on_integration_sync_run
  BEFORE INSERT ON public.integration_sync_runs
  FOR EACH ROW EXECUTE FUNCTION public.assign_current_tenant();

CREATE POLICY "tenant admins manage integrations" ON public.integration_connections FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin());
CREATE POLICY "tenant admins read integration runs" ON public.integration_sync_runs FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin());
