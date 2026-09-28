-- Make Phase 1 staff roles operational. Tenant admins retain full control.

CREATE POLICY "chapter managers manage chapters"
  ON public.chapters FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.has_staff_role('chapter_manager'))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.has_staff_role('chapter_manager'));

CREATE POLICY "chapter managers manage chapter memberships"
  ON public.chapter_members FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.has_staff_role('chapter_manager'))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.has_staff_role('chapter_manager'));

CREATE POLICY "events staff manage events"
  ON public.events FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.has_staff_role('events'))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.has_staff_role('events'));

CREATE POLICY "events staff read event outcomes"
  ON public.event_outcomes FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.has_staff_role('events'));
