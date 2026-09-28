-- University-owned SSO enrollment. Provider secrets and certificate material stay
-- in the identity provider / deployment secret manager, never in this database.

CREATE TYPE public.sso_provider AS ENUM ('saml', 'oidc', 'azure_ad', 'google_workspace');

CREATE TABLE public.institutional_sso_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider public.sso_provider NOT NULL,
  email_domain text NOT NULL,
  display_name text NOT NULL,
  issuer_reference text,
  enabled boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email_domain)
);

CREATE TRIGGER institutional_sso_configurations_updated
  BEFORE UPDATE ON public.institutional_sso_configurations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER assign_tenant_on_institutional_sso_configuration
  BEFORE INSERT ON public.institutional_sso_configurations
  FOR EACH ROW EXECUTE FUNCTION public.assign_current_tenant();

ALTER TABLE public.institutional_sso_configurations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.institutional_sso_configurations FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institutional_sso_configurations TO authenticated;
CREATE POLICY "tenant admins manage institutional sso" ON public.institutional_sso_configurations FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin());
