CREATE TYPE public.ai_recommendation_status AS ENUM ('draft','pending_approval','approved','rejected','expired');
CREATE TABLE public.ai_recommendations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
 profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 recommendation_type text NOT NULL CHECK (recommendation_type IN ('event','mentor','job','chapter','introduction')),
 rationale text NOT NULL, proposed_action jsonb NOT NULL DEFAULT '{}'::jsonb,
 status public.ai_recommendation_status NOT NULL DEFAULT 'draft', reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 reviewed_at timestamptz, expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_recommendations_review_queue_idx ON public.ai_recommendations (tenant_id, status, created_at DESC);
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_recommendations FROM anon;
GRANT SELECT, UPDATE ON public.ai_recommendations TO authenticated;
CREATE TRIGGER assign_tenant_on_ai_recommendation BEFORE INSERT ON public.ai_recommendations FOR EACH ROW EXECUTE FUNCTION public.assign_current_tenant();
CREATE POLICY "members read own recommendations" ON public.ai_recommendations FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id() AND profile_id = public.current_profile_id());
CREATE POLICY "tenant admins review recommendations" ON public.ai_recommendations FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin()) WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin());
