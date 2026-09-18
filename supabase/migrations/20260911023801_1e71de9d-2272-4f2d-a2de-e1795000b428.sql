-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','alumni','student');
CREATE TYPE public.verification_status AS ENUM ('pending','verified','rejected');
CREATE TYPE public.request_status AS ENUM ('pending','accepted','declined');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text NOT NULL,
  email text,
  avatar_url text,
  headline text,
  bio text,
  job_title text,
  company text,
  location text,
  degree text,
  grad_year int,
  industry text,
  skills text[] NOT NULL DEFAULT '{}',
  linkedin_url text,
  portfolio_url text,
  status public.verification_status NOT NULL DEFAULT 'pending',
  is_student boolean NOT NULL DEFAULT false,
  is_mentor boolean NOT NULL DEFAULT false,
  mentor_topics text[] NOT NULL DEFAULT '{}',
  show_on_donor_wall boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "verified profiles are public" ON public.profiles FOR SELECT USING (status = 'verified');
CREATE POLICY "own profile readable" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- CONNECTIONS
CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER connections_updated BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "see own connections" ON public.connections FOR SELECT TO authenticated USING (requester_id = public.current_profile_id() OR addressee_id = public.current_profile_id() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "send connection" ON public.connections FOR INSERT TO authenticated WITH CHECK (requester_id = public.current_profile_id());
CREATE POLICY "respond to connection" ON public.connections FOR UPDATE TO authenticated USING (addressee_id = public.current_profile_id()) WITH CHECK (addressee_id = public.current_profile_id());
CREATE POLICY "cancel connection" ON public.connections FOR DELETE TO authenticated USING (requester_id = public.current_profile_id());

-- JOBS
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  industry text,
  work_mode text NOT NULL DEFAULT 'onsite',
  employment_type text NOT NULL DEFAULT 'Full-time',
  salary_range text,
  description text NOT NULL,
  apply_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER jobs_updated BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "active jobs public" ON public.jobs FOR SELECT USING (is_active);
CREATE POLICY "own jobs readable" ON public.jobs FOR SELECT TO authenticated USING (posted_by = public.current_profile_id() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "post job" ON public.jobs FOR INSERT TO authenticated WITH CHECK (posted_by = public.current_profile_id());
CREATE POLICY "edit own job" ON public.jobs FOR UPDATE TO authenticated USING (posted_by = public.current_profile_id() OR public.has_role(auth.uid(),'admin')) WITH CHECK (posted_by = public.current_profile_id() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "delete own job" ON public.jobs FOR DELETE TO authenticated USING (posted_by = public.current_profile_id() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see relevant applications" ON public.job_applications FOR SELECT TO authenticated USING (applicant_id = public.current_profile_id() OR public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.posted_by = public.current_profile_id()));
CREATE POLICY "apply to job" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (applicant_id = public.current_profile_id());
CREATE POLICY "poster updates application" ON public.job_applications FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.posted_by = public.current_profile_id())) WITH CHECK (true);
CREATE POLICY "withdraw application" ON public.job_applications FOR DELETE TO authenticated USING (applicant_id = public.current_profile_id());

-- MENTORSHIP
CREATE TABLE public.mentorship_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic text NOT NULL,
  message text,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_requests TO authenticated;
GRANT ALL ON public.mentorship_requests TO service_role;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER mentorship_updated BEFORE UPDATE ON public.mentorship_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "see own mentorship" ON public.mentorship_requests FOR SELECT TO authenticated USING (mentor_id = public.current_profile_id() OR mentee_id = public.current_profile_id() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "request mentorship" ON public.mentorship_requests FOR INSERT TO authenticated WITH CHECK (mentee_id = public.current_profile_id());
CREATE POLICY "mentor responds" ON public.mentorship_requests FOR UPDATE TO authenticated USING (mentor_id = public.current_profile_id()) WITH CHECK (mentor_id = public.current_profile_id());
CREATE POLICY "mentee cancels" ON public.mentorship_requests FOR DELETE TO authenticated USING (mentee_id = public.current_profile_id());

CREATE TABLE public.mentorship_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.mentorship_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mentorship_messages TO authenticated;
GRANT ALL ON public.mentorship_messages TO service_role;
ALTER TABLE public.mentorship_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see thread messages" ON public.mentorship_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.mentorship_requests r WHERE r.id = request_id AND (r.mentor_id = public.current_profile_id() OR r.mentee_id = public.current_profile_id())));
CREATE POLICY "send thread message" ON public.mentorship_messages FOR INSERT TO authenticated WITH CHECK (sender_id = public.current_profile_id() AND EXISTS (SELECT 1 FROM public.mentorship_requests r WHERE r.id = request_id AND r.status = 'accepted' AND (r.mentor_id = public.current_profile_id() OR r.mentee_id = public.current_profile_id())));

-- EVENTS
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Networking',
  location text,
  is_virtual boolean NOT NULL DEFAULT false,
  cover_image_url text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "events public" ON public.events FOR SELECT USING (true);
CREATE POLICY "create event" ON public.events FOR INSERT TO authenticated WITH CHECK (created_by = public.current_profile_id());
CREATE POLICY "edit own event" ON public.events FOR UPDATE TO authenticated USING (created_by = public.current_profile_id() OR public.has_role(auth.uid(),'admin')) WITH CHECK (created_by = public.current_profile_id() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "delete own event" ON public.events FOR DELETE TO authenticated USING (created_by = public.current_profile_id() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, profile_id)
);
GRANT SELECT ON public.event_rsvps TO anon;
GRANT SELECT, INSERT, DELETE ON public.event_rsvps TO authenticated;
GRANT ALL ON public.event_rsvps TO service_role;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsvps public" ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "rsvp self" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "un-rsvp self" ON public.event_rsvps FOR DELETE TO authenticated USING (profile_id = public.current_profile_id() OR public.has_role(auth.uid(),'admin'));

-- GIVING
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  goal_cents bigint NOT NULL DEFAULT 0,
  seed_raised_cents bigint NOT NULL DEFAULT 0,
  cover_image_url text,
  ends_on date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaigns TO anon;
GRANT SELECT ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "campaigns public" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "admins manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  donor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  donor_name text,
  amount_cents bigint NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.donations TO anon;
GRANT SELECT, INSERT ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations public" ON public.donations FOR SELECT USING (true);
CREATE POLICY "donate" ON public.donations FOR INSERT TO authenticated WITH CHECK (donor_profile_id IS NULL OR donor_profile_id = public.current_profile_id());

-- DEMO DATA
INSERT INTO public.profiles (id, full_name, email, avatar_url, headline, bio, job_title, company, location, degree, grad_year, industry, skills, linkedin_url, status, is_mentor, mentor_topics) VALUES
('11111111-1111-4111-8111-000000000001','Amara Okonkwo','amara.okonkwo@example.com','https://i.pravatar.cc/300?img=47','Product leader building fintech for emerging markets','Ten years shipping payments products across three continents. Happy to talk product craft, career pivots and negotiating offers.','VP of Product','Flutterwave','Lagos, Nigeria','BSc Computer Science',2012,'Technology','{"Product Strategy","Fintech","Roadmapping","Leadership"}','https://linkedin.com/in/example','verified',true,'{"Career pivots","Product management","Negotiation"}'),
('11111111-1111-4111-8111-000000000002','Daniel Reyes','daniel.reyes@example.com','https://i.pravatar.cc/300?img=12','Staff engineer, distributed systems','I build boring infrastructure that never pages anyone. Ask me about systems design interviews.','Staff Software Engineer','Stripe','San Francisco, CA','BSc Computer Engineering',2015,'Technology','{"Go","Distributed Systems","Kubernetes","Mentoring"}','https://linkedin.com/in/example','verified',true,'{"Systems design","Interview prep","Big tech careers"}'),
('11111111-1111-4111-8111-000000000003','Priya Nair','priya.nair@example.com','https://i.pravatar.cc/300?img=32','Healthcare strategy consultant','Former surgeon turned strategy consultant. I love helping people who feel stuck mid-career.','Principal','McKinsey & Company','London, UK','MBBS, MBA',2009,'Healthcare','{"Strategy","Healthcare","Operations"}','https://linkedin.com/in/example','verified',true,'{"Consulting","Med school to industry"}'),
('11111111-1111-4111-8111-000000000004','Marcus Bell','marcus.bell@example.com','https://i.pravatar.cc/300?img=15','Climate tech founder','Building grid-scale storage. Previously two exits. Always looking for sharp engineers from campus.','Co-founder & CEO','Voltaic Grid','Austin, TX','MSc Mechanical Engineering',2011,'Energy','{"Hardware","Fundraising","Cleantech"}','https://linkedin.com/in/example','verified',true,'{"Startups","Fundraising"}'),
('11111111-1111-4111-8111-000000000005','Sofia Almeida','sofia.almeida@example.com','https://i.pravatar.cc/300?img=45','Design director','Design systems, brand, and hiring. I review portfolios every other Friday.','Design Director','Figma','Lisbon, Portugal','BA Visual Communication',2014,'Design','{"Design Systems","Brand","Figma","Hiring"}','https://linkedin.com/in/example','verified',true,'{"Portfolio reviews","Design careers"}'),
('11111111-1111-4111-8111-000000000006','James Whitfield','james.whitfield@example.com','https://i.pravatar.cc/300?img=52','Investment banking, TMT coverage','Happy to demystify finance recruiting for anyone considering it.','Vice President','Goldman Sachs','New York, NY','BSc Economics',2013,'Finance','{"M&A","Valuation","Financial Modelling"}','https://linkedin.com/in/example','verified',true,'{"Finance recruiting","Networking"}'),
('11111111-1111-4111-8111-000000000007','Chen Wei','chen.wei@example.com','https://i.pravatar.cc/300?img=68','ML research scientist','Working on multimodal models. Open to chatting with anyone applying to PhD programs.','Research Scientist','DeepMind','Zurich, Switzerland','PhD Computer Science',2018,'Technology','{"Machine Learning","PyTorch","Research"}','https://linkedin.com/in/example','verified',true,'{"PhD applications","Research careers"}'),
('11111111-1111-4111-8111-000000000008','Nadia Haddad','nadia.haddad@example.com','https://i.pravatar.cc/300?img=26','Public interest lawyer','Housing rights litigation. I mentor students considering public sector law.','Senior Counsel','Legal Aid Society','Chicago, IL','JD',2016,'Legal','{"Litigation","Policy","Public Interest"}','https://linkedin.com/in/example','verified',true,'{"Law school","Public sector careers"}'),
('11111111-1111-4111-8111-000000000009','Tom Eriksen','tom.eriksen@example.com','https://i.pravatar.cc/300?img=51','Supply chain lead','Logistics nerd. Ask me about operations roles that are not consulting.','Director of Operations','Maersk','Copenhagen, Denmark','BSc Industrial Engineering',2010,'Logistics','{"Supply Chain","Operations","Analytics"}',NULL,'verified',false,'{}'),
('11111111-1111-4111-8111-000000000010','Grace Mwangi','grace.mwangi@example.com','https://i.pravatar.cc/300?img=41','Biotech scientist turned VC','Investing in early-stage life sciences.','Principal','Atlas Ventures','Boston, MA','PhD Molecular Biology',2014,'Healthcare','{"Venture Capital","Biotech","Due Diligence"}',NULL,'verified',true,'{"Science to VC","Biotech careers"}'),
('11111111-1111-4111-8111-000000000011','Leo Fontaine','leo.fontaine@example.com','https://i.pravatar.cc/300?img=59','Marketing lead, consumer brands','Growth, brand and everything in between.','Head of Growth','Oatly','Paris, France','BA Marketing',2017,'Marketing','{"Growth","Brand","Paid Social"}',NULL,'verified',false,'{}'),
('11111111-1111-4111-8111-000000000012','Hana Suzuki','hana.suzuki@example.com','https://i.pravatar.cc/300?img=44','Architect, sustainable housing','Designing low-carbon multifamily housing in dense cities.','Senior Architect','Nikken Sekkei','Tokyo, Japan','MArch',2013,'Architecture','{"Sustainability","Urban Design","Revit"}',NULL,'verified',true,'{"Architecture careers","Portfolio reviews"}'),
('11111111-1111-4111-8111-000000000013','Isabel Moreno','isabel.moreno@example.com','https://i.pravatar.cc/300?img=25','Final-year student, Computer Science','Interested in backend engineering and looking for a summer internship.','Student','University','Remote','BSc Computer Science',2027,'Technology','{"Python","React","SQL"}',NULL,'verified',false,'{}'),
('11111111-1111-4111-8111-000000000014','Omar Farouk','omar.farouk@example.com','https://i.pravatar.cc/300?img=13','Recent graduate, data analytics','Just graduated and exploring analytics roles.','Analyst','Deloitte','Dubai, UAE','BSc Statistics',2024,'Consulting','{"SQL","Tableau","Python"}',NULL,'pending',false,'{}'),
('11111111-1111-4111-8111-000000000015','Rachel Adeyemi','rachel.adeyemi@example.com','https://i.pravatar.cc/300?img=31','Product designer','Recently moved into product design from journalism.','Product Designer','Duolingo','Berlin, Germany','BA Journalism',2019,'Design','{"UX Research","Prototyping"}',NULL,'pending',false,'{}');

UPDATE public.profiles SET is_student = true WHERE id = '11111111-1111-4111-8111-000000000013';

INSERT INTO public.jobs (id, posted_by, title, company, location, industry, work_mode, employment_type, salary_range, description, apply_url) VALUES
('22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-000000000002','Backend Engineer, Payments','Stripe','San Francisco, CA','Technology','hybrid','Full-time','$180k – $240k','Join the payments core team building the APIs that move billions of dollars a day. Strong Go or Java background welcome. Alumni referrals get a direct look from the hiring manager.','https://example.com/apply'),
('22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-000000000001','Associate Product Manager','Flutterwave','Lagos, Nigeria','Technology','onsite','Full-time','₦ competitive','Early-career PM role on the merchant experience team. We look for people who write clearly and talk to customers weekly. Grads from the last three years encouraged to apply.','https://example.com/apply'),
('22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-000000000004','Power Electronics Intern','Voltaic Grid','Austin, TX','Energy','onsite','Internship','$45/hr','Summer internship working on inverter design for grid-scale battery systems. You will own a real subsystem, not a slide deck.','https://example.com/apply'),
('22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-000000000005','Product Designer','Figma','Remote','Design','remote','Full-time','$150k – $190k','Work across design systems and core editor surfaces. Portfolio matters more than years of experience.','https://example.com/apply'),
('22222222-2222-4222-8222-000000000005','11111111-1111-4111-8111-000000000006','Investment Banking Analyst','Goldman Sachs','New York, NY','Finance','onsite','Full-time','$110k + bonus','TMT coverage analyst program starting next summer. Applications reviewed on a rolling basis.','https://example.com/apply'),
('22222222-2222-4222-8222-000000000006','11111111-1111-4111-8111-000000000010','Biotech Investment Fellow','Atlas Ventures','Boston, MA','Healthcare','hybrid','Contract','$85k','One-year fellowship for PhDs curious about venture. You will run diligence on early-stage therapeutics.','https://example.com/apply'),
('22222222-2222-4222-8222-000000000007','11111111-1111-4111-8111-000000000011','Growth Marketing Manager','Oatly','Paris, France','Marketing','hybrid','Full-time','€65k – €80k','Own paid acquisition across EU markets. Comfortable with spreadsheets and creative briefs alike.','https://example.com/apply'),
('22222222-2222-4222-8222-000000000008','11111111-1111-4111-8111-000000000007','Research Engineer, Multimodal','DeepMind','Zurich, Switzerland','Technology','onsite','Full-time','CHF 160k+','Support research on multimodal reasoning. Strong PyTorch and distributed training experience required.','https://example.com/apply');

INSERT INTO public.events (id, created_by, title, description, category, location, is_virtual, cover_image_url, starts_at, ends_at) VALUES
('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-000000000001','Class of 2012–2016 Reunion Weekend','Three days back on campus: departmental open houses, a black-tie dinner in the great hall, and a Sunday brunch on the quad. Bring family.','Reunion','Main Campus, Great Hall',false,'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=70', now() + interval '38 days', now() + interval '40 days'),
('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-000000000002','Systems Design Interview Workshop','A live two-hour workshop where we design a URL shortener, a rate limiter and a feed ranking service. Recording shared afterwards.','Webinar','Zoom',true,'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=70', now() + interval '9 days', now() + interval '9 days' + interval '2 hours'),
('33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-000000000006','NYC Alumni Networking Night','Drinks and short intros at a rooftop in Midtown. Finance, tech and law folks usually turn out in force.','Networking','The Wren, Midtown, New York',false,'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=70', now() + interval '17 days', now() + interval '17 days' + interval '4 hours'),
('33333333-3333-4333-8333-000000000004','11111111-1111-4111-8111-000000000005','Portfolio Review Clinic','Fifteen-minute slots with working designers. Students and career switchers welcome.','Workshop','Zoom',true,'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=70', now() + interval '25 days', now() + interval '25 days' + interval '3 hours'),
('33333333-3333-4333-8333-000000000005','11111111-1111-4111-8111-000000000004','Founders Fireside: From Lab to Launch','Marcus Bell on taking hardware from a campus lab bench to a 200-person company.','Webinar','Zoom',true,'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=70', now() - interval '21 days', now() - interval '21 days' + interval '90 minutes'),
('33333333-3333-4333-8333-000000000006','11111111-1111-4111-8111-000000000003','London Alumni Summer Picnic','Our largest UK gathering yet — 180 alumni and families in Regent''s Park.','Networking','Regent''s Park, London',false,'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=70', now() - interval '65 days', now() - interval '65 days' + interval '5 hours'),
('33333333-3333-4333-8333-000000000007','11111111-1111-4111-8111-000000000010','Careers in Biotech Panel','Four alumni across research, VC and regulatory affairs answered student questions for 90 minutes.','Webinar','Zoom',true,'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=70', now() - interval '120 days', now() - interval '120 days' + interval '90 minutes');

INSERT INTO public.event_rsvps (event_id, profile_id)
SELECT e.id, p.id FROM public.events e
JOIN public.profiles p ON true
WHERE e.id IN ('33333333-3333-4333-8333-000000000001','33333333-3333-4333-8333-000000000002','33333333-3333-4333-8333-000000000003')
  AND p.id <= '11111111-1111-4111-8111-000000000009';

INSERT INTO public.campaigns (id, title, description, goal_cents, seed_raised_cents, cover_image_url, ends_on) VALUES
('44444444-4444-4444-8444-000000000001','Scholarship Fund','Need-based scholarships for 40 incoming students each year. Every gift is matched by the alumni board up to $250.',10000000,4520000,'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=70','2027-06-30'),
('44444444-4444-4444-8444-000000000002','Student Innovation Lab','A 24/7 prototyping space with fabrication tools, funded entirely by alumni.',5000000,3810000,'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=70','2027-03-31'),
('44444444-4444-4444-8444-000000000003','Emergency Student Support','Small, fast grants for students facing housing, medical or travel emergencies.',2500000,930000,'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=70','2026-12-31');

INSERT INTO public.donations (campaign_id, donor_profile_id, donor_name, amount_cents, is_anonymous, message) VALUES
('44444444-4444-4444-8444-000000000001','11111111-1111-4111-8111-000000000004','Marcus Bell',500000,false,'The scholarship is the only reason I got through year one.'),
('44444444-4444-4444-8444-000000000001','11111111-1111-4111-8111-000000000006','James Whitfield',250000,false,NULL),
('44444444-4444-4444-8444-000000000001',NULL,NULL,100000,true,NULL),
('44444444-4444-4444-8444-000000000002','11111111-1111-4111-8111-000000000001','Amara Okonkwo',150000,false,'Build things, break things.'),
('44444444-4444-4444-8444-000000000002','11111111-1111-4111-8111-000000000002','Daniel Reyes',75000,false,NULL),
('44444444-4444-4444-8444-000000000003','11111111-1111-4111-8111-000000000010','Grace Mwangi',120000,false,'Nobody should drop out over a $400 problem.'),
('44444444-4444-4444-8444-000000000003','11111111-1111-4111-8111-000000000003','Priya Nair',60000,false,NULL);
