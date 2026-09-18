# Alumni Network Hub

Build "AlumniConnect" — a full-stack alumni management platform for universities.

CORE PHILOSOPHY:

Most alumni platforms fail because they're glorified directories nobody opens after graduation. 

Build for daily/weekly utility, not a one-time signup. The engine is: verified profiles → 

searchable network → real value exchange (jobs, mentorship, events, giving).

TECH STACK:

- React + Vite + TypeScript

- Tailwind CSS (clean, modern, university-branded — customizable primary color)

- Supabase (auth, Postgres database, storage for profile photos/documents)

- React Router for navigation

USER ROLES:

1. Alumni — profile, network, jobs, mentorship, events, giving

2. Students — limited access: browse mentors, view job board, RSVP events

3. Admin (university staff) — manage verification, moderate content, view analytics

CORE FEATURES:

1. AUTH & VERIFICATION

- Sign up with email + graduation year + degree program

- Admin approval queue to verify alumni status (badge once verified)

- Profile: photo, bio, current job/company, location, degree, grad year, skills tags, 

  social links (LinkedIn, portfolio)

2. ALUMNI DIRECTORY / NETWORK

- Searchable + filterable grid (by year, industry, location, company, skills)

- Card view with quick "Connect" button

- Individual profile pages

3. JOB BOARD

- Alumni post job openings at their companies

- Students/alumni apply or express interest

- Filter by industry, location, remote/onsite

4. MENTORSHIP MATCHING

- Alumni opt-in as mentors with topics they can help with

- Students/junior alumni send mentorship requests

- Simple accept/decline + messaging thread

5. EVENTS

- Admin/alumni create events (reunions, webinars, networking nights)

- RSVP system with attendee count

- Past events archive with photos

6. GIVING / DONATIONS

- Simple donation page (mock payment flow — Stripe placeholder)

- Campaign progress bars (e.g., "Scholarship Fund: $45k / $100k")

- Donor recognition wall (opt-in)

7. ADMIN DASHBOARD

- Verification queue

- Analytics: total alumni, engagement rate, donation totals, job postings

- Content moderation

DESIGN:

- Clean, premium, trustworthy — think Stripe/Linear aesthetic, not a stuffy university portal

- Dark mode toggle

- Mobile responsive

- Empty states and loading skeletons everywhere (no blank screens)

DATABASE (Supabase tables):

- profiles (user info, role, verification status)

- connections (alumni-to-alumni links)

- jobs (postings)

- mentorship_requests

- events + event_rsvps

- donations + campaigns

Start with auth + profile creation + directory as the MVP, then layer in jobs, 

mentorship, events, and giving. Make it feel alive with realistic seed/demo data.

DO NOT USE LOVABLE CLOUD. use the supabase there and you have full access to it

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9268b0b5-202e-460d-aeaf-8f3c48f1e338).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
