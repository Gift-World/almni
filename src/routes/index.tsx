import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Briefcase, CalendarDays, HeartHandshake, Users } from "lucide-react";

import { AlumniCard } from "@/components/AlumniCard";
import { CardGridSkeleton } from "@/components/CardSkeletons";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AlumniConnect — Your university network, still working for you" },
      {
        name: "description",
        content:
          "A verified alumni network with a job board, mentorship matching, events and campus giving. Built for weekly use, not a one-time signup.",
      },
      { property: "og:title", content: "AlumniConnect — the alumni network people actually use" },
      {
        property: "og:description",
        content: "Verified profiles, real jobs, mentors who answer, events and giving in one place.",
      },
    ],
  }),
  component: Home,
});

function useHomeStats() {
  return useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const [alumni, jobs, events, donations] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "verified"),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("campaigns").select("seed_raised_cents"),
      ]);
      const raised = (donations.data ?? []).reduce((sum, c) => sum + Number(c.seed_raised_cents), 0);
      return {
        alumni: alumni.count ?? 0,
        jobs: jobs.count ?? 0,
        events: events.count ?? 0,
        raised,
      };
    },
  });
}

function Home() {
  const stats = useHomeStats();
  const featured = useQuery({
    queryKey: ["featured-alumni"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("status", "verified")
        .eq("is_mentor", true)
        .order("created_at")
        .limit(6);
      return data ?? [];
    },
  });

  return (
    <>
      <section className="bg-hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            <BadgeCheck className="size-3.5" /> Every profile verified by the university
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-6xl">
            Your university network, still working for you
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
            Not another directory nobody opens. AlumniConnect turns your class list into a live
            exchange of jobs, mentorship, events and support.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Join the network</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link to="/alumni">Browse alumni</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 lg:grid-cols-4">
          {[
            { label: "Verified alumni", value: stats.data?.alumni, icon: Users },
            { label: "Open roles", value: stats.data?.jobs, icon: Briefcase },
            { label: "Events hosted", value: stats.data?.events, icon: CalendarDays },
            {
              label: "Raised this year",
              value: stats.data ? money(stats.data.raised) : undefined,
              icon: HeartHandshake,
            },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className="mx-auto size-5 text-primary" />
              <p className="mt-2 font-display text-3xl font-bold">
                {stats.isLoading || s.value === undefined ? "—" : s.value}
              </p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Users,
              title: "Verified directory",
              body: "Search classmates by year, industry, company, city or skill — and know they're real.",
              to: "/alumni" as const,
            },
            {
              icon: Briefcase,
              title: "Job board",
              body: "Roles posted by alumni at their own companies, with a warm intro built in.",
              to: "/jobs" as const,
            },
            {
              icon: HeartHandshake,
              title: "Mentorship",
              body: "Alumni opt in with the topics they can genuinely help on. Request, accept, chat.",
              to: "/mentorship" as const,
            },
            {
              icon: CalendarDays,
              title: "Events",
              body: "Reunions, webinars and city meetups with live RSVP counts and a past archive.",
              to: "/events" as const,
            },
          ].map((f) => (
            <Link key={f.title} to={f.to} className="card-surface card-interactive block p-6">
              <f.icon className="size-5 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Explore <ArrowRight className="size-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Alumni offering mentorship</h2>
            <p className="mt-1 text-muted-foreground">
              People who said yes to helping — reach out this week.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/mentorship">See all mentors</Link>
          </Button>
        </div>
        {featured.isLoading ? (
          <CardGridSkeleton />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.data?.map((p) => <AlumniCard key={p.id} profile={p} />)}
          </div>
        )}
      </section>
    </>
  );
}
