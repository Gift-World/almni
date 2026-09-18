import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Clock, UserCog } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile — AlumniConnect" },
      {
        name: "description",
        content: "Edit your alumni profile, skills, social links and mentorship availability.",
      },
      { property: "og:title", content: "My profile — AlumniConnect" },
      { property: "og:description", content: "Keep your alumni profile current." },
    ],
  }),
  component: MyProfile,
});

function MyProfile() {
  const { profile, profileLoading, session, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const stats = useQuery({
    queryKey: ["my-connections", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const [conn, apps, reqs] = await Promise.all([
        supabase
          .from("connections")
          .select("id", { count: "exact", head: true })
          .or(`requester_id.eq.${profile!.id},addressee_id.eq.${profile!.id}`),
        supabase.from("job_applications").select("id", { count: "exact", head: true }),
        supabase.from("mentorship_requests").select("id", { count: "exact", head: true }),
      ]);
      return { connections: conn.count ?? 0, applications: apps.count ?? 0, requests: reqs.count ?? 0 };
    },
  });

  const save = useMutation({
    mutationFn: async (form: FormData) => {
      const payload = {
        full_name: String(form.get("full_name")),
        headline: String(form.get("headline")) || null,
        bio: String(form.get("bio")) || null,
        job_title: String(form.get("job_title")) || null,
        company: String(form.get("company")) || null,
        location: String(form.get("location")) || null,
        industry: String(form.get("industry")) || null,
        degree: String(form.get("degree")) || null,
        grad_year: Number(form.get("grad_year")) || null,
        avatar_url: String(form.get("avatar_url")) || null,
        linkedin_url: String(form.get("linkedin_url")) || null,
        portfolio_url: String(form.get("portfolio_url")) || null,
        skills: String(form.get("skills"))
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        is_mentor: form.get("is_mentor") === "on",
        mentor_topics: String(form.get("mentor_topics"))
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        show_on_donor_wall: form.get("show_on_donor_wall") === "on",
      };

      if (profile) {
        const { error } = await supabase.from("profiles").update(payload).eq("id", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert({ ...payload, user_id: session!.user.id, email: session!.user.email ?? null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Profile saved");
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["directory"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <PageShell
      title={profile ? "My profile" : "Complete your profile"}
      subtitle={
        profile
          ? "Keep this current — it's what classmates and recruiters see."
          : "Add a few details so the university can verify you and others can find you."
      }
      action={
        profile ? (
          <Button asChild variant="outline">
            <Link to="/alumni/$id" params={{ id: profile.id }}>
              View public profile
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="space-y-4">
          <div className="card-surface p-5 text-center">
            <Avatar className="mx-auto size-20">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
              <AvatarFallback>{initials(profile?.full_name ?? "?")}</AvatarFallback>
            </Avatar>
            <p className="mt-3 font-semibold">{profile?.full_name ?? session?.user.email}</p>
            <div className="mt-2 flex justify-center">
              {profile?.status === "verified" ? (
                <Badge className="gap-1">
                  <BadgeCheck className="size-3" /> Verified alumni
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="size-3" /> Verification pending
                </Badge>
              )}
            </div>
          </div>
          <div className="card-surface space-y-3 p-5 text-sm">
            <p className="flex justify-between">
              <span className="text-muted-foreground">Connections</span>
              <span className="font-medium">{stats.data?.connections ?? "—"}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Job interests</span>
              <span className="font-medium">{stats.data?.applications ?? "—"}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Mentorship threads</span>
              <span className="font-medium">{stats.data?.requests ?? "—"}</span>
            </p>
          </div>
        </aside>

        <form
          className="card-surface space-y-5 p-6 lg:col-span-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(new FormData(e.currentTarget));
          }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UserCog className="size-4" /> Profile details
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <F name="full_name" label="Full name" defaultValue={profile?.full_name ?? ""} required />
            <F name="headline" label="Headline" defaultValue={profile?.headline ?? ""} />
            <F name="job_title" label="Job title" defaultValue={profile?.job_title ?? ""} />
            <F name="company" label="Company" defaultValue={profile?.company ?? ""} />
            <F name="location" label="Location" defaultValue={profile?.location ?? ""} />
            <F name="industry" label="Industry" defaultValue={profile?.industry ?? ""} />
            <F name="degree" label="Degree" defaultValue={profile?.degree ?? ""} />
            <F
              name="grad_year"
              label="Graduation year"
              type="number"
              defaultValue={profile?.grad_year ? String(profile.grad_year) : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" name="bio" rows={4} defaultValue={profile?.bio ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <F
              name="avatar_url"
              label="Photo URL"
              defaultValue={profile?.avatar_url ?? ""}
              placeholder="https://…"
            />
            <F name="skills" label="Skills (comma separated)" defaultValue={profile?.skills.join(", ") ?? ""} />
            <F name="linkedin_url" label="LinkedIn" defaultValue={profile?.linkedin_url ?? ""} />
            <F name="portfolio_url" label="Portfolio" defaultValue={profile?.portfolio_url ?? ""} />
          </div>

          <div className="space-y-4 rounded-lg border border-border p-4">
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-medium">Available as a mentor</span>
                <span className="block text-sm text-muted-foreground">
                  You'll appear on the mentorship page and can accept or decline every request.
                </span>
              </span>
              <Switch name="is_mentor" defaultChecked={profile?.is_mentor ?? false} />
            </label>
            <F
              name="mentor_topics"
              label="Topics you can help with (comma separated)"
              defaultValue={profile?.mentor_topics.join(", ") ?? ""}
            />
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium">Show my name on the donor wall</span>
              <Switch name="show_on_donor_wall" defaultChecked={profile?.show_on_donor_wall ?? true} />
            </label>
          </div>

          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </div>
    </PageShell>
  );
}

function F({
  name,
  label,
  defaultValue,
  required,
  type,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        type={type}
        placeholder={placeholder}
      />
    </div>
  );
}
