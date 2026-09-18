import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, Heart, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
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
  const { session, profile } = useAuth();
  const queryClient = useQueryClient();
  const [openCampaign, setOpenCampaign] = useState<string | null>(null);

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

  const donate = useMutation({
    mutationFn: async ({ campaignId, form }: { campaignId: string; form: FormData }) => {
      const amount = Math.round(Number(form.get("amount")) * 100);
      if (!amount || amount <= 0) throw new Error("Enter an amount");
      const anonymous = form.get("anonymous") === "on";
      const { error } = await supabase.from("donations").insert({
        campaign_id: campaignId,
        donor_profile_id: profile?.id ?? null,
        donor_name: anonymous ? null : (profile?.full_name ?? String(form.get("donor_name"))),
        amount_cents: amount,
        is_anonymous: anonymous,
        message: String(form.get("message")) || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thank you — your gift was recorded (demo payment)");
      setOpenCampaign(null);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["donor-wall"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageShell
      title="Giving"
      subtitle="Every campaign below funds students directly. Payments are a demo flow — no card is charged."
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
                      <span className="text-muted-foreground">of {money(Number(c.goal_cents))}</span>
                    </div>
                    <Progress value={pct} className="mt-2" />
                    <p className="mt-2 text-xs text-muted-foreground">{pct}% funded</p>
                  </div>
                  <Button className="mt-4" onClick={() => setOpenCampaign(c.id)}>
                    <Heart className="size-4" /> Give to this fund
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

      <Dialog open={!!openCampaign} onOpenChange={(o) => !o && setOpenCampaign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make a gift</DialogTitle>
            <DialogDescription>
              This is a demo checkout — a Stripe payment would appear here in production.
            </DialogDescription>
          </DialogHeader>
          {!session ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Sign in to have your gift recognised.</p>
              <Button asChild className="w-full">
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!openCampaign) return;
                donate.mutate({ campaignId: openCampaign, form: new FormData(e.currentTarget) });
              }}
            >
              <div className="flex gap-2">
                {[25, 100, 500].map((amt) => (
                  <Badge key={amt} variant="outline" className="px-3 py-1">
                    ${amt}
                  </Badge>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input id="amount" name="amount" type="number" min={1} defaultValue={100} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="d-message">Message (optional)</Label>
                <Input id="d-message" name="message" placeholder="Why you're giving" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="anonymous" className="size-4" /> Give anonymously
              </label>
              <Button type="submit" className="w-full" disabled={donate.isPending}>
                <CreditCard className="size-4" /> Complete demo payment
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
