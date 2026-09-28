-- Phase 1: institution-grade staff responsibilities.
-- Keeps the existing `admin` role as the tenant steward while granting
-- narrowly scoped operational roles to invited university staff.

CREATE TYPE public.staff_role AS ENUM (
  'alumni_relations',
  'advancement',
  'careers',
  'events',
  'communications',
  'chapter_manager',
  'analyst',
  'read_only'
);

CREATE TABLE public.staff_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.staff_role NOT NULL,
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, role)
);

ALTER TABLE public.staff_invitations
  ADD COLUMN staff_role public.staff_role;

ALTER TABLE public.staff_role_assignments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_role_assignments FROM anon;
GRANT SELECT ON public.staff_role_assignments TO authenticated;

CREATE TRIGGER assign_tenant_on_staff_role_assignment
  BEFORE INSERT ON public.staff_role_assignments
  FOR EACH ROW EXECUTE FUNCTION public.assign_current_tenant();

CREATE POLICY "staff read own assignments"
  ON public.staff_role_assignments FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id()
    AND (user_id = auth.uid() OR public.is_tenant_admin()));

CREATE POLICY "tenant admins manage staff assignments"
  ON public.staff_role_assignments FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin());

CREATE OR REPLACE FUNCTION public.has_staff_role(_role public.staff_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_tenant_admin()
    OR EXISTS (
      SELECT 1 FROM public.staff_role_assignments
      WHERE tenant_id = public.current_tenant_id()
        AND user_id = auth.uid()
        AND role = _role
    );
$$;

REVOKE ALL ON FUNCTION public.has_staff_role(public.staff_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_staff_role(public.staff_role) TO authenticated, service_role;
