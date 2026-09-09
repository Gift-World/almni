-- ==========================================
-- ALUMNIOS CORE ENTITIES & MULTI-TENANCY
-- ==========================================

-- 1. Student Profiles
CREATE TABLE public.student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    expected_graduation_year INTEGER,
    degree TEXT,
    major TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Companies (Entities that can be employers or alumni businesses)
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    logo_url TEXT,
    description TEXT,
    is_alumni_owned BOOLEAN DEFAULT false,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Alumni owner if applicable
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 3. Employer Profiles (Users who recruit)
CREATE TABLE public.employer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    job_title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Education History
CREATE TABLE public.education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    institution_name TEXT NOT NULL,
    degree TEXT,
    field_of_study TEXT,
    start_year INTEGER,
    end_year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;

-- 5. Employment History
CREATE TABLE public.employment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT,
    is_current BOOLEAN DEFAULT false,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.employment ENABLE ROW LEVEL SECURITY;

-- 6. Chapters (Communities)
CREATE TABLE public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    category TEXT, -- e.g., 'Regional', 'Academic', 'Interest'
    cover_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chapter_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'MEMBER', -- 'LEAD', 'MEMBER'
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(chapter_id, user_id)
);
ALTER TABLE public.chapter_members ENABLE ROW LEVEL SECURITY;

-- 7. Events
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    is_virtual BOOLEAN DEFAULT false,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    capacity INTEGER,
    cover_image_url TEXT,
    status TEXT DEFAULT 'PUBLISHED',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'REGISTERED', -- 'REGISTERED', 'CANCELLED', 'ATTENDED'
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- 8. Mentorship
CREATE TABLE public.mentorship_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    is_accepting_mentees BOOLEAN DEFAULT true,
    max_mentees INTEGER DEFAULT 2,
    expertise_areas TEXT[],
    about_me TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);
ALTER TABLE public.mentorship_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.mentorship_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

-- 9. Jobs
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    is_remote BOOLEAN DEFAULT false,
    employment_type TEXT, -- 'FULL_TIME', 'INTERNSHIP', etc.
    status TEXT DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 10. Fundraising / Giving
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    goal_amount DECIMAL,
    raised_amount DECIMAL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'ACTIVE',
    cover_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount DECIMAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    is_anonymous BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES FOR TENANT ISOLATION
-- ==========================================

DO $$
DECLARE
    t_name text;
    tables text[] := ARRAY[
        'student_profiles', 'companies', 'employer_profiles', 'education', 
        'employment', 'chapters', 'chapter_members', 'events', 
        'event_registrations', 'mentorship_profiles', 'mentorship_requests', 
        'jobs', 'campaigns', 'donations'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables LOOP
        EXECUTE format('
            CREATE POLICY "Users can view data in their university" 
            ON public.%I FOR SELECT 
            USING (university_id = public.get_current_user_university_id() OR public.get_current_user_role() = ''SUPER_ADMIN'');
        ', t_name);
        
        EXECUTE format('
            CREATE POLICY "Admins can manage data in their university" 
            ON public.%I FOR ALL 
            USING (
                (public.get_current_user_role() IN (''SUPER_ADMIN'', ''UNI_ADMIN'') AND university_id = public.get_current_user_university_id())
                OR public.get_current_user_role() = ''SUPER_ADMIN''
            );
        ', t_name);
    END LOOP;
END $$;

-- Individual Users can manage their own profiles/history
CREATE POLICY "Users can update their student profile" ON public.student_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their employer profile" ON public.employer_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their education" ON public.education FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their employment" ON public.employment FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their chapter memberships" ON public.chapter_members FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their event registrations" ON public.event_registrations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their mentorship profile" ON public.mentorship_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their mentorship requests" ON public.mentorship_requests FOR ALL USING (mentor_id = auth.uid() OR mentee_id = auth.uid());
CREATE POLICY "Users can view their own donations" ON public.donations FOR SELECT USING (donor_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_employer_profiles_updated_at BEFORE UPDATE ON public.employer_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON public.education FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_employment_updated_at BEFORE UPDATE ON public.employment FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_mentorship_profiles_updated_at BEFORE UPDATE ON public.mentorship_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_mentorship_requests_updated_at BEFORE UPDATE ON public.mentorship_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
