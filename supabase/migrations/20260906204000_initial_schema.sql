-- Create roles enum
CREATE TYPE app_role AS ENUM ('SUPER_ADMIN', 'UNI_ADMIN', 'CHAPTER_LEAD', 'ALUMNI', 'STUDENT');

-- Create universities table (tenants)
CREATE TABLE public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#000000',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on universities
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (links auth.users to roles and universities)
-- This extends the auth.users table with app-specific info
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'ALUMNI',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, university_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create alumni_profiles table
CREATE TABLE public.alumni_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    graduation_year INTEGER,
    degree TEXT,
    major TEXT,
    location TEXT,
    industry TEXT,
    employer TEXT,
    bio TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Enable RLS on alumni_profiles
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to get the current user's university_id
CREATE OR REPLACE FUNCTION public.get_current_user_university_id()
RETURNS UUID AS $$
DECLARE
    uni_id UUID;
BEGIN
    SELECT university_id INTO uni_id
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    RETURN uni_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
DECLARE
    u_role app_role;
BEGIN
    SELECT role INTO u_role
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    RETURN u_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS POLICIES

-- Universities: 
-- Super admins can see all. Others can only see their own university.
CREATE POLICY "Super admins can view all universities"
    ON public.universities FOR SELECT
    USING (public.get_current_user_role() = 'SUPER_ADMIN');

CREATE POLICY "Users can view their own university"
    ON public.universities FOR SELECT
    USING (id = public.get_current_user_university_id());

CREATE POLICY "Super admins can manage universities"
    ON public.universities FOR ALL
    USING (public.get_current_user_role() = 'SUPER_ADMIN');

-- User Roles:
-- Users can read their own roles, or Uni Admins can read all roles in their university
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view roles in their university"
    ON public.user_roles FOR SELECT
    USING (
        public.get_current_user_role() IN ('SUPER_ADMIN', 'UNI_ADMIN') 
        AND university_id = public.get_current_user_university_id()
    );

-- Alumni Profiles:
-- Users can view profiles in their own university
CREATE POLICY "Users can view profiles in their university"
    ON public.alumni_profiles FOR SELECT
    USING (university_id = public.get_current_user_university_id());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.alumni_profiles FOR UPDATE
    USING (user_id = auth.uid());

-- Admins can manage profiles in their university
CREATE POLICY "Admins can manage profiles in their university"
    ON public.alumni_profiles FOR ALL
    USING (
        public.get_current_user_role() IN ('SUPER_ADMIN', 'UNI_ADMIN') 
        AND university_id = public.get_current_user_university_id()
    );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_universities_updated_at
    BEFORE UPDATE ON public.universities
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_alumni_profiles_updated_at
    BEFORE UPDATE ON public.alumni_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
