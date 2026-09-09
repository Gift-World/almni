# AlumniOS

AlumniOS is a modern, multi-tenant Alumni Management Platform designed to transform how universities engage with their alumni networks. It provides a comprehensive suite of tools for both administrators and alumni, facilitating networking, mentorship, event management, and data-driven insights.

## Core Features

### For Universities (Admins)
- **Multi-Tenant Architecture**: Securely manage data isolated by university subdomain (e.g., `tenant1.alumnios.com`).
- **Advanced Directory & Segmentation**: Filter alumni by industry, location, and impact. Create dynamic segments for targeted outreach.
- **Engagement & Impact Scoring**: Automatically calculate alumni "Impact Scores" based on event attendance, mentorship, and donations to identify highly engaged community members.
- **Data Quality Tracking**: Monitor the freshness and completeness of alumni profiles.
- **Automated Campaigns**: Build automated workflows for engagement, re-engagement, and fundraising campaigns.
- **Mentorship Matching**: AI-assisted and manual matching of mentors and mentees.
- **Hybrid Event Management**: Organize and manage physical, virtual, and hybrid events. Track RSVPs and attendance modes.
- **QR Verification & Check-in**: Securely verify alumni IDs via QR scanning for event check-ins or campus access.

### For Alumni (Users)
- **Digital Alumni Passport**: A dynamic, secure Digital ID (with QR code) for verified access to campus facilities and events.
- **Interactive Directory & Network**: Find and connect with fellow alumni based on shared interests, industries, or geographic locations.
- **Mentorship Programs**: Easily opt-in to become a mentor or find a mentor within the network.
- **Event Registration**: Register for upcoming physical, virtual, or hybrid events.
- **Profile Management**: Keep contact information, job history, and engagement preferences up to date.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Getting Started

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Set up your Supabase project and environment variables:
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. Run migrations:
   Ensure you run the SQL scripts found in `supabase/migrations/` to set up the multi-tenant schema, tables, and triggers (including the Impact Score triggers).

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access the app:
   - Platform Landing Page: `http://localhost:3000`
   - Tenant Portal (e.g., for 'demo' uni): `http://localhost:3000/tenant/demo`
   - Tenant Admin Dashboard: `http://localhost:3000/tenant/demo/admin`

## Architecture Overview

The system uses a Supabase backend with Row Level Security (RLS) to enforce strict data isolation between tenants.

- `public.universities`: Stores tenant information and subdomains.
- `public.alumni_profiles`: Unified profile table storing engagement metrics, impact scores, and data quality scores.
- `public.activity_logs`: An append-only log of alumni activities that automatically triggers recalculation of the Impact Score via a PostgreSQL trigger function.
- `public.event_registrations`: Links alumni to events, tracking whether they attend in-person or virtually.
- `public.student_alumni_connections`: Tracks mentorship pairings and networking connections.
- `public.campaign_automations`: Stores automated communication workflows for specific alumni segments.

## License
MIT License
