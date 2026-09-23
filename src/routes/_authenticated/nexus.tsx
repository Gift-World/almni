import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BriefcaseBusiness, CalendarDays, Compass, MapPin, Sparkles, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate, initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/nexus")({
  head: () => ({ meta: [{ title: "Your opportunity concierge — AlumniConnect" }] }),
  component: NexusDashboard,
});

function NexusDashboard() {
  const { profile } = useAuth();
  const people = useQuery({
    queryKey: ["nexus-people", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, avatar_url, headline, company, job_title, location, industry, skills, is_mentor",
        )
        .eq("status", "verified")
        .neq("id", profile!.id)
        .order("is_mentor", { ascending: false })
        .limit(24);
      if (error) throw error;
      return data ?? [];
    },
  });
  const jobs = useQuery({
    queryKey: ["nexus-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, company, location")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });
  const events = useQuery({
    queryKey: ["nexus-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, location, is_virtual, starts_at")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(2);
      if (error) throw error;
      return data ?? [];
    },
  });
  const matches = (people.data ?? [])
    .map((person) => ({
      person,
      score:
        Number(person.industry === profile?.industry) * 3 +
        Number(person.location === profile?.location) * 2 +
        Number(person.is_mentor),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <PageShell
      title="Your opportunity concierge"
      subtitle="Relevant people, opportunities and gatherings from your university network. Recommendations are based on your profile and remain fully under your control."
      action={
        <Button asChild variant="outline">
          <Link to="/map">
            <MapPin className="size-4" /> Explore global network
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h2 className="text-xl font-bold">People worth meeting</h2>
          </div>
          {people.isLoading ? null : matches.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Complete your profile to unlock introductions"
              description="Your industry, location, skills and goals make recommendations more useful."
            />
          ) : (
            <div className="space-y-3">
              {matches.map(({ person, score }) => (
                <article key={person.id} className="card-surface p-5">
                  <div className="flex flex-wrap items-start gap-4">
                    <Avatar className="size-12">
                      <AvatarImage src={person.avatar_url ?? undefined} alt="" />
                      <AvatarFallback>{initials(person.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{person.full_name}</h3>
                        {person.is_mentor ? <Badge>Mentor</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {person.job_title ?? person.headline ?? "Alumni member"}
                        {person.company ? ` · ${person.company}` : ""}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {score > 0
                          ? "Suggested because you share an industry, city, or mentoring interest."
                          : "A verified member of your university network."}
                      </p>
                    </div>
                    <Button asChild size="sm">
                      <Link to="/alumni/$id" params={{ id: person.id }}>
                        View profile
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <aside className="space-y-6">
          <section className="card-surface p-5">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="size-5 text-primary" />
              <h2 className="font-semibold">Opportunity radar</h2>
            </div>
            <div className="mt-4 space-y-3">
              {(jobs.data ?? []).map((job) => (
                <div key={job.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {job.company} · {job.location}
                  </p>
                </div>
              ))}
              {jobs.data?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active roles yet.</p>
              ) : null}
            </div>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/jobs">Browse opportunities</Link>
            </Button>
          </section>
          <section className="card-surface p-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              <h2 className="font-semibold">Next gatherings</h2>
            </div>
            <div className="mt-4 space-y-3">
              {(events.data ?? []).map((event) => (
                <div key={event.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium text-sm">{event.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(event.starts_at)} · {event.is_virtual ? "Online" : event.location}
                  </p>
                </div>
              ))}
              {events.data?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events yet.</p>
              ) : null}
            </div>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/events">
                <Compass className="size-4" /> See all events
              </Link>
            </Button>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}
