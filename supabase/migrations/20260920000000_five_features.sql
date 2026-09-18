-- Migration for 5-Feature Expansion: Businesses, Feed, Map, Messaging, International

-- 1. Add country to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;

-- Backfill some international data for existing dummy profiles (for the map)
UPDATE public.profiles SET country = 'United States', location = 'San Francisco, CA' WHERE id = '11111111-1111-4111-8111-000000000001';
UPDATE public.profiles SET country = 'United Kingdom', location = 'London' WHERE id = '11111111-1111-4111-8111-000000000002';
UPDATE public.profiles SET country = 'Nigeria', location = 'Lagos' WHERE id = '11111111-1111-4111-8111-000000000003';
UPDATE public.profiles SET country = 'Canada', location = 'Toronto, ON' WHERE id = '11111111-1111-4111-8111-000000000004';
UPDATE public.profiles SET country = 'Germany', location = 'Berlin' WHERE id = '11111111-1111-4111-8111-000000000005';
UPDATE public.profiles SET country = 'Singapore', location = 'Singapore' WHERE id = '11111111-1111-4111-8111-000000000006';

-- 2. Create Businesses Table
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  industry text,
  location text,
  country text,
  website text,
  discount_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER businesses_updated BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT ON public.businesses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;

CREATE POLICY "Anyone can view businesses" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Users can create businesses" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM profiles WHERE id = owner_id));
CREATE POLICY "Users can update own businesses" ON public.businesses FOR UPDATE USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = owner_id));
CREATE POLICY "Users can delete own businesses" ON public.businesses FOR DELETE USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = owner_id));

-- 3. Create Feed Posts Table
CREATE TABLE public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER feed_posts_updated BEFORE UPDATE ON public.feed_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT ON public.feed_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_posts TO authenticated;

CREATE POLICY "Anyone can view posts" ON public.feed_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert posts" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM profiles WHERE id = author_id));
CREATE POLICY "Users can update own posts" ON public.feed_posts FOR UPDATE USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = author_id));
CREATE POLICY "Users can delete own posts" ON public.feed_posts FOR DELETE USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = author_id));

-- 4. Create Feed Comments Table
CREATE TABLE public.feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.feed_posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER feed_comments_updated BEFORE UPDATE ON public.feed_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT ON public.feed_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_comments TO authenticated;

CREATE POLICY "Anyone can view comments" ON public.feed_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON public.feed_comments FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM profiles WHERE id = author_id));
CREATE POLICY "Users can update own comments" ON public.feed_comments FOR UPDATE USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = author_id));
CREATE POLICY "Users can delete own comments" ON public.feed_comments FOR DELETE USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = author_id));

-- 5. Create Direct Messages Table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;

CREATE POLICY "Users can read own messages" ON public.messages FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = sender_id) OR
  auth.uid() = (SELECT user_id FROM profiles WHERE id = receiver_id)
);
CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = sender_id)
);
CREATE POLICY "Users can update read_at" ON public.messages FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = receiver_id)
);

-- Seed Data for Businesses
INSERT INTO public.businesses (id, owner_id, name, description, industry, location, country, website, discount_code) VALUES
('55555555-5555-4555-8555-000000000001', '11111111-1111-4111-8111-000000000001', 'Acme Tech Consulting', 'Boutique tech consulting for early stage startups.', 'Technology', 'San Francisco, CA', 'United States', 'https://example.com', 'ALUMNI20'),
('55555555-5555-4555-8555-000000000002', '11111111-1111-4111-8111-000000000002', 'Thames Legal Services', 'Immigration and business law for expats.', 'Legal', 'London', 'United Kingdom', 'https://example.com', NULL),
('55555555-5555-4555-8555-000000000003', '11111111-1111-4111-8111-000000000003', 'Lagos Creative Agency', 'Brand design and marketing for African tech.', 'Design', 'Lagos', 'Nigeria', 'https://example.com', 'GO_ALUMNI');

-- Seed Data for Feed
INSERT INTO public.feed_posts (id, author_id, content, created_at) VALUES
('66666666-6666-4666-8666-000000000001', '11111111-1111-4111-8111-000000000001', 'Just moved to San Francisco! Would love to connect with other alumni in the Bay Area.', now() - interval '2 days'),
('66666666-6666-4666-8666-000000000002', '11111111-1111-4111-8111-000000000003', 'We just launched our new creative agency in Lagos! Check out the business directory for an alumni discount.', now() - interval '5 hours');

INSERT INTO public.feed_comments (id, post_id, author_id, content, created_at) VALUES
('77777777-7777-4777-8777-000000000001', '66666666-6666-4666-8666-000000000001', '11111111-1111-4111-8111-000000000004', 'Welcome to the Bay! Let''s grab coffee.', now() - interval '1 day'),
('77777777-7777-4777-8777-000000000002', '66666666-6666-4666-8666-000000000002', '11111111-1111-4111-8111-000000000005', 'Congratulations! Beautiful work on the site.', now() - interval '1 hour');
