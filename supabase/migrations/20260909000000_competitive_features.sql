-- ==========================================
-- ALUMNIOS COMPETITIVE FEATURES & ENGAGEMENT
-- ==========================================

-- 1. Extend Alumni Profiles
ALTER TABLE public.alumni_profiles
ADD COLUMN alumni_id TEXT UNIQUE DEFAULT 'ALUMNI-' || upper(substr(md5(random()::text), 1, 8)),
ADD COLUMN qr_verification_token UUID UNIQUE DEFAULT gen_random_uuid(),
ADD COLUMN data_quality_score INTEGER DEFAULT 0,
ADD COLUMN last_profile_update TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN impact_score INTEGER DEFAULT 0;

-- 2. Activity Tracking
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- e.g., 'EVENT_ATTENDANCE', 'MENTORSHIP', 'PROFILE_UPDATE'
    points INTEGER DEFAULT 0,
    reference_id UUID, -- Optional link to event, job, etc.
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Activity Logs RLS
CREATE POLICY "Users can view their own activity logs" 
ON public.activity_logs FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view activity logs in their university" 
ON public.activity_logs FOR SELECT 
USING (
    (public.get_current_user_role() IN ('SUPER_ADMIN', 'UNI_ADMIN') AND university_id = public.get_current_user_university_id())
    OR public.get_current_user_role() = 'SUPER_ADMIN'
);

-- 3. Extend Events for Hybrid
ALTER TABLE public.events
ADD COLUMN event_type TEXT DEFAULT 'PHYSICAL', -- 'PHYSICAL', 'VIRTUAL', 'HYBRID'
ADD COLUMN virtual_meeting_link TEXT;

ALTER TABLE public.event_registrations
ADD COLUMN attendance_mode TEXT, -- 'PHYSICAL', 'VIRTUAL'
ADD COLUMN check_in_time TIMESTAMPTZ;

-- 4. Automated Campaigns
CREATE TABLE public.campaign_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- e.g., 'NEW_GRADUATE', 'INACTIVE_ALUMNUS', 'UPCOMING_REUNION'
    trigger_conditions JSONB, -- Conditions to evaluate
    action_template TEXT NOT NULL, -- Email template ID or content
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.campaign_automations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_campaign_automations_updated_at BEFORE UPDATE ON public.campaign_automations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Campaign Automations RLS
CREATE POLICY "Admins can manage campaign automations in their university" 
ON public.campaign_automations FOR ALL 
USING (
    (public.get_current_user_role() IN ('SUPER_ADMIN', 'UNI_ADMIN') AND university_id = public.get_current_user_university_id())
    OR public.get_current_user_role() = 'SUPER_ADMIN'
);

-- 5. Student-Alumni Connections
CREATE TABLE public.student_alumni_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alumni_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    connection_type TEXT NOT NULL, -- 'MENTORSHIP', 'INTERNSHIP', 'JOB', 'NETWORKING'
    status TEXT DEFAULT 'ACTIVE',
    outcome TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, alumni_id, connection_type)
);
ALTER TABLE public.student_alumni_connections ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_student_alumni_connections_updated_at BEFORE UPDATE ON public.student_alumni_connections FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Student-Alumni Connections RLS
CREATE POLICY "Users can view their own connections" 
ON public.student_alumni_connections FOR SELECT 
USING (student_id = auth.uid() OR alumni_id = auth.uid());

CREATE POLICY "Admins can manage connections in their university" 
ON public.student_alumni_connections FOR ALL 
USING (
    (public.get_current_user_role() IN ('SUPER_ADMIN', 'UNI_ADMIN') AND university_id = public.get_current_user_university_id())
    OR public.get_current_user_role() = 'SUPER_ADMIN'
);

-- Helper Function to update impact score
CREATE OR REPLACE FUNCTION public.calculate_impact_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.alumni_profiles
    SET impact_score = (
        SELECT COALESCE(SUM(points), 0)
        FROM public.activity_logs
        WHERE user_id = NEW.user_id
    )
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_impact_score
AFTER INSERT OR UPDATE OR DELETE ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION public.calculate_impact_score();
