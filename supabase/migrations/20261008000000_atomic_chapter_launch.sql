-- A chapter and its founding leader must be created as one transaction.
-- This prevents a partial chapter if membership or leader assignment fails.

CREATE OR REPLACE FUNCTION public.launch_chapter(
  _name text, _slug text, _city text, _country text, _timezone text, _description text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _tenant_id uuid := public.current_tenant_id();
  _profile_id uuid := public.current_profile_id();
  _chapter_id uuid;
BEGIN
  IF _tenant_id IS NULL OR _profile_id IS NULL THEN
    RAISE EXCEPTION 'A tenant-scoped authenticated profile is required';
  END IF;
  IF NOT (public.is_tenant_admin() OR public.has_staff_role('chapter_manager'::public.staff_role)) THEN
    RAISE EXCEPTION 'Chapter-manager permission is required';
  END IF;
  INSERT INTO public.chapters (tenant_id, name, slug, city, country, timezone, description)
  VALUES (_tenant_id, _name, _slug, NULLIF(_city, ''), _country, COALESCE(NULLIF(_timezone, ''), 'UTC'), NULLIF(_description, ''))
  RETURNING id INTO _chapter_id;
  INSERT INTO public.chapter_members (tenant_id, chapter_id, profile_id, role)
  VALUES (_tenant_id, _chapter_id, _profile_id, 'leader');
  UPDATE public.chapters SET leader_id = _profile_id WHERE id = _chapter_id;
  RETURN _chapter_id;
END;
$$;

REVOKE ALL ON FUNCTION public.launch_chapter(text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.launch_chapter(text, text, text, text, text, text) TO authenticated;
