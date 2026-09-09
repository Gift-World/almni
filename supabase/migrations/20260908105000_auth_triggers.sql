-- ==========================================
-- AUTHENTICATION & ONBOARDING TRIGGERS
-- ==========================================

-- Function to handle new user registration and link them to a university
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    uni_id UUID;
BEGIN
    -- For now, we will extract university_id from raw_user_meta_data if passed during signup
    -- Otherwise, this will be handled by application logic (Server Actions)
    IF NEW.raw_user_meta_data->>'university_id' IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, university_id, role)
        VALUES (
            NEW.id,
            (NEW.raw_user_meta_data->>'university_id')::UUID,
            COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'ALUMNI'::app_role)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_registration();
