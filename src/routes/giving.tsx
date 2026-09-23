import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { exactMoney, money } from "@/lib/format";

export const Route = createFileRoute("/giving")({
  head: () => ({
    meta: [
      { title: "Giving — AlumniConnect" },
      {
        name: "description",
        content:
          "Support scholarships, the student innovation lab and emergency student aid. Track campaign progress and see the donor wall.",
      },
      { property: "og:title", content: "Give back — AlumniConnect" },
      {
        property: "og:description",
        content: "Fund scholarships and student support, and watch each campaign fill up.",
      },
    ],
  }),
  component: GivingPage,
});

function GivingPage() {
  const campaigns = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*, donations(amount_cents)")
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const donors = useQuery({
    queryKey: ["donor-wall"],
    queryFn: async () => {
      const { data } = await supabase
        .from("donations")
        .select("id, amount_cents, is_anonymous, donor_name, message, created_at")
        .eq("is_anonymous", false)
        .order("amount_cents", { ascending: false })
        .limit(24);
      return data ?? [];
    },
  });

  return (
    <PageShell
      title="Giving"
      subtitle="Campaign progress and recognised giving from the university advancement office."
    >
      {campaigns.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {(campaigns.data ?? []).map((c) => {
            const raised =
              Number(c.seed_raised_cents) +
              (c.donations ?? []).reduce((s, d) => s + Number(d.amount_cents), 0);
            const pct = Math.min(100, Math.round((raised / Number(c.goal_cents)) * 100));
            return (
              <article key={c.id} className="card-surface flex flex-col overflow-hidden">
                {c.cover_image_url ? (
                  <img
                    src={c.cover_image_url}
                    alt={c.title}
                    loading="lazy"
                    className="h-36 w-full object-cover"
                  />
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-semibold">{c.title}</h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-5">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-display text-xl font-bold">{money(raised)}</span>
                      <span className="text-muted-foreground">
                        of {money(Number(c.goal_cents))}
                      </span>
                    </div>
                    <Progress value={pct} className="mt-2" />
                    <p className="mt-2 text-xs text-muted-foreground">{pct}% funded</p>
                  </div>
                  <Button
                    className="mt-4"
                    disabled
                    title="A verified payment provider must be connected before gifts can be accepted."
                  >
                    <ShieldCheck className="size-4" /> Online giving coming soon
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="mt-14">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-accent" />
          <h2 className="text-2xl font-bold">Donor wall</h2>
        </div>
        <p className="mt-1 text-muted-foreground">
          Alumni who chose to be recognised. You can always give anonymously.
        </p>
        <div className="mt-6">
          {donors.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : donors.data?.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="The wall is empty — for now"
              description="Be the first name on it. Every gift, any size, is listed here unless you opt out."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {donors.data?.map((d) => (
                <div key={d.id} className="card-surface p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{d.donor_name ?? "Friend of the university"}</p>
                    <Badge variant="secondary">{exactMoney(Number(d.amount_cents))}</Badge>
                  </div>
                  {d.message ? (
                    <p className="mt-2 text-sm italic text-muted-foreground">“{d.message}”</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
