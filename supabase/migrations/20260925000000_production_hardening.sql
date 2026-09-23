-- Production hardening: tenant isolation, trusted account provisioning, and safe defaults.
-- Apply after the existing multi-tenancy migration.

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles roles
    WHERE roles.user_id = auth.uid()
      AND roles.role = 'admin'
      AND roles.tenant_id = public.current_tenant_id()
  );
$$;

REVOKE ALL ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_tenant_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_tenant_id(), public.is_tenant_admin() TO authenticated, service_role;

-- A profile must exist even when Supabase email confirmation is enabled. The old client-side
-- insert only ran when a session was returned, stranding confirmed users without a profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, degree, grad_year, is_student)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), split_part(COALESCE(NEW.email, 'Member'), '@', 1)),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'degree', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'grad_year', '')::integer,
    COALESCE((NEW.raw_user_meta_data ->> 'is_student')::boolean, false)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Client supplied tenant IDs are never trusted. All member-created records inherit the
-- authenticated member's tenant; service_role writes are unaffected by RLS.
CREATE OR REPLACE FUNCTION public.assign_current_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.tenant_id := public.current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE item text;
BEGIN
  FOREACH item IN ARRAY ARRAY[
    'connections', 'jobs', 'job_applications', 'mentorship_requests',
    'mentorship_messages', 'events', 'event_rsvps', 'campaigns', 'donations',
    'businesses', 'feed_posts', 'feed_comments', 'messages'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS assign_tenant_on_insert ON public.%I', item);
    EXECUTE format('CREATE TRIGGER assign_tenant_on_insert BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.assign_current_tenant()', item);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', item);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', item);
  END LOOP;
END $$;

REVOKE ALL ON TABLE public.profiles, public.user_roles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;

-- Remove every permissive pre-tenancy policy before replacing it with tenant-scoped policies.
DROP POLICY IF EXISTS "verified profiles are public" ON public.profiles;
DROP POLICY IF EXISTS "own profile readable" ON public.profiles;
DROP POLICY IF EXISTS "create own profile" ON public.profiles;
DROP POLICY IF EXISTS "update own profile" ON public.profiles;
DROP POLICY IF EXISTS "admins delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "tenant profiles visible to tenant" ON public.profiles;
DROP POLICY IF EXISTS "own roles readable" ON public.user_roles;
DROP POLICY IF EXISTS "see own connections" ON public.connections;
DROP POLICY IF EXISTS "send connection" ON public.connections;
DROP POLICY IF EXISTS "respond to connection" ON public.connections;
DROP POLICY IF EXISTS "cancel connection" ON public.connections;
DROP POLICY IF EXISTS "active jobs public" ON public.jobs;
DROP POLICY IF EXISTS "own jobs readable" ON public.jobs;
DROP POLICY IF EXISTS "post job" ON public.jobs;
DROP POLICY IF EXISTS "edit own job" ON public.jobs;
DROP POLICY IF EXISTS "delete own job" ON public.jobs;
DROP POLICY IF EXISTS "tenant jobs visible to tenant" ON public.jobs;
DROP POLICY IF EXISTS "see relevant applications" ON public.job_applications;
DROP POLICY IF EXISTS "apply to job" ON public.job_applications;
DROP POLICY IF EXISTS "poster updates application" ON public.job_applications;
DROP POLICY IF EXISTS "withdraw application" ON public.job_applications;
DROP POLICY IF EXISTS "see own mentorship" ON public.mentorship_requests;
DROP POLICY IF EXISTS "request mentorship" ON public.mentorship_requests;
DROP POLICY IF EXISTS "mentor responds" ON public.mentorship_requests;
DROP POLICY IF EXISTS "mentee cancels" ON public.mentorship_requests;
DROP POLICY IF EXISTS "see thread messages" ON public.mentorship_messages;
DROP POLICY IF EXISTS "send thread message" ON public.mentorship_messages;
DROP POLICY IF EXISTS "events public" ON public.events;
DROP POLICY IF EXISTS "create event" ON public.events;
DROP POLICY IF EXISTS "edit own event" ON public.events;
DROP POLICY IF EXISTS "delete own event" ON public.events;
DROP POLICY IF EXISTS "tenant events visible to tenant" ON public.events;
DROP POLICY IF EXISTS "rsvps public" ON public.event_rsvps;
DROP POLICY IF EXISTS "rsvp self" ON public.event_rsvps;
DROP POLICY IF EXISTS "un-rsvp self" ON public.event_rsvps;
DROP POLICY IF EXISTS "campaigns public" ON public.campaigns;
DROP POLICY IF EXISTS "admins manage campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "tenant campaigns visible to tenant" ON public.campaigns;
DROP POLICY IF EXISTS "donations public" ON public.donations;
DROP POLICY IF EXISTS "donate" ON public.donations;
DROP POLICY IF EXISTS "Anyone can view businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can create businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can update own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can delete own businesses" ON public.businesses;
DROP POLICY IF EXISTS "tenant businesses visible to tenant" ON public.businesses;
DROP POLICY IF EXISTS "Anyone can view posts" ON public.feed_posts;
DROP POLICY IF EXISTS "Users can insert posts" ON public.feed_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.feed_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.feed_posts;
DROP POLICY IF EXISTS "tenant posts visible to tenant" ON public.feed_posts;
DROP POLICY IF EXISTS "Anyone can view comments" ON public.feed_comments;
DROP POLICY IF EXISTS "Users can insert comments" ON public.feed_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.feed_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.feed_comments;
DROP POLICY IF EXISTS "Users can read own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update read_at" ON public.messages;

CREATE POLICY "tenant profiles readable" ON public.profiles FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "create own default profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND tenant_id = '00000000-0000-0000-0000-000000000001');
CREATE POLICY "tenant profile updates" ON public.profiles FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id() AND (user_id = auth.uid() OR public.is_tenant_admin())) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant admin deletes profiles" ON public.profiles FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin());
CREATE POLICY "tenant roles readable" ON public.user_roles FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id() AND (user_id = auth.uid() OR public.is_tenant_admin()));

-- Initial platform steward. Replace this with invitation-based staff provisioning before
-- onboarding additional university administrators.
INSERT INTO public.user_roles (user_id, role, tenant_id)
SELECT users.id, 'admin', '00000000-0000-0000-0000-000000000001'
FROM auth.users AS users
WHERE lower(users.email) = lower('charlesgiftangila@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

CREATE POLICY "tenant connections readable" ON public.connections FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id() AND (requester_id = public.current_profile_id() OR addressee_id = public.current_profile_id() OR public.is_tenant_admin()));
CREATE POLICY "tenant connection create" ON public.connections FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND requester_id = public.current_profile_id());
CREATE POLICY "tenant connection update" ON public.connections FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id() AND (addressee_id = public.current_profile_id() OR public.is_tenant_admin())) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant connection delete" ON public.connections FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND (requester_id = public.current_profile_id() OR public.is_tenant_admin()));

CREATE POLICY "tenant jobs readable" ON public.jobs FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant jobs create" ON public.jobs FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND posted_by = public.current_profile_id());
CREATE POLICY "tenant jobs update" ON public.jobs FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id() AND (posted_by = public.current_profile_id() OR public.is_tenant_admin())) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant jobs delete" ON public.jobs FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND (posted_by = public.current_profile_id() OR public.is_tenant_admin()));

CREATE POLICY "tenant applications readable" ON public.job_applications FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id() AND (applicant_id = public.current_profile_id() OR public.is_tenant_admin() OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.posted_by = public.current_profile_id())));
CREATE POLICY "tenant applications create" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND applicant_id = public.current_profile_id());
CREATE POLICY "tenant applications update" ON public.job_applications FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id() AND (public.is_tenant_admin() OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.posted_by = public.current_profile_id()))) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant applications delete" ON public.job_applications FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND applicant_id = public.current_profile_id());

CREATE POLICY "tenant mentorship readable" ON public.mentorship_requests FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id() AND (mentor_id = public.current_profile_id() OR mentee_id = public.current_profile_id() OR public.is_tenant_admin()));
CREATE POLICY "tenant mentorship create" ON public.mentorship_requests FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND mentee_id = public.current_profile_id());
CREATE POLICY "tenant mentorship update" ON public.mentorship_requests FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id() AND (mentor_id = public.current_profile_id() OR public.is_tenant_admin())) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant mentorship delete" ON public.mentorship_requests FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND (mentee_id = public.current_profile_id() OR public.is_tenant_admin()));
CREATE POLICY "tenant mentorship messages readable" ON public.mentorship_messages FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id() AND EXISTS (SELECT 1 FROM public.mentorship_requests r WHERE r.id = request_id AND (r.mentor_id = public.current_profile_id() OR r.mentee_id = public.current_profile_id() OR public.is_tenant_admin())));
CREATE POLICY "tenant mentorship messages create" ON public.mentorship_messages FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND sender_id = public.current_profile_id() AND EXISTS (SELECT 1 FROM public.mentorship_requests r WHERE r.id = request_id AND r.status = 'accepted' AND (r.mentor_id = public.current_profile_id() OR r.mentee_id = public.current_profile_id())));

CREATE POLICY "tenant events readable" ON public.events FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant events create" ON public.events FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND created_by = public.current_profile_id());
CREATE POLICY "tenant events update" ON public.events FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id() AND (created_by = public.current_profile_id() OR public.is_tenant_admin())) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant events delete" ON public.events FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND (created_by = public.current_profile_id() OR public.is_tenant_admin()));
CREATE POLICY "tenant rsvps readable" ON public.event_rsvps FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant rsvps create" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND profile_id = public.current_profile_id());
CREATE POLICY "tenant rsvps delete" ON public.event_rsvps FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND (profile_id = public.current_profile_id() OR public.is_tenant_admin()));

CREATE POLICY "tenant campaigns readable" ON public.campaigns FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant campaigns managed by admins" ON public.campaigns FOR ALL TO authenticated USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin()) WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin());
CREATE POLICY "tenant donations readable" ON public.donations FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
-- Gifts must be created by a verified payment webhook or staff workflow, never by a browser.
REVOKE INSERT ON TABLE public.donations FROM authenticated;

CREATE POLICY "tenant businesses readable" ON public.businesses FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant businesses create" ON public.businesses FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND auth.uid() = (SELECT user_id FROM public.profiles WHERE id = owner_id));
CREATE POLICY "tenant businesses update" ON public.businesses FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id() AND (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = owner_id) OR public.is_tenant_admin())) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant businesses delete" ON public.businesses FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = owner_id) OR public.is_tenant_admin()));
CREATE POLICY "tenant posts readable" ON public.feed_posts FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant posts create" ON public.feed_posts FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id));
CREATE POLICY "tenant posts update" ON public.feed_posts FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id() AND (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id) OR public.is_tenant_admin())) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant posts delete" ON public.feed_posts FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id) OR public.is_tenant_admin()));
CREATE POLICY "tenant comments readable" ON public.feed_comments FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant comments create" ON public.feed_comments FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id));
CREATE POLICY "tenant comments update" ON public.feed_comments FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id() AND (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id) OR public.is_tenant_admin())) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant comments delete" ON public.feed_comments FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id) OR public.is_tenant_admin()));
CREATE POLICY "tenant messages readable" ON public.messages FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id() AND (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = sender_id) OR auth.uid() = (SELECT user_id FROM public.profiles WHERE id = receiver_id)));
CREATE POLICY "tenant messages create" ON public.messages FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND auth.uid() = (SELECT user_id FROM public.profiles WHERE id = sender_id));
CREATE POLICY "tenant messages update" ON public.messages FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id() AND auth.uid() = (SELECT user_id FROM public.profiles WHERE id = receiver_id)) WITH CHECK (tenant_id = public.current_tenant_id());
