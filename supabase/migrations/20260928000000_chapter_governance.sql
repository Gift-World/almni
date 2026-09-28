-- Phase 2: governed global chapters and local volunteer leadership.
-- Apply after global_network_operations and institutional_staff_roles.

CREATE INDEX chapter_members_tenant_chapter_idx
  ON public.chapter_members (tenant_id, chapter_id);
CREATE INDEX event_outcomes_tenant_event_idx
  ON public.event_outcomes (tenant_id, event_id);

-- A leader must be a member of the same chapter. This prevents a staff member
-- from accidentally appointing an unrelated profile as a local leader.
CREATE OR REPLACE FUNCTION public.validate_chapter_leader()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.leader_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.chapter_members
    WHERE chapter_id = NEW.id AND profile_id = NEW.leader_id AND role = 'leader'
  ) THEN
    RAISE EXCEPTION 'Chapter leader must hold a leader membership in this chapter';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_chapter_leader_assignment
  BEFORE INSERT OR UPDATE OF leader_id ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.validate_chapter_leader();

CREATE POLICY "tenant admins manage chapter membership"
  ON public.chapter_members FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin());
