import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  ExternalLink,
  GraduationCap,
  MapPin,
  MessageSquarePlus,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/alumni/$id")({
  head: () => ({
    meta: [
      { title: "Alumni profile — AlumniConnect" },
      {
        name: "description",
        content: "View an alumni profile: role, company, degree, skills and mentorship topics.",
      },
      { property: "og:title", content: "Alumni profile — AlumniConnect" },
      {
        property: "og:description",
        content: "Career history, skills and mentorship topics for a verified alumnus.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { id } = Route.useParams();
  const { profile: me, session } = useAuth();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const connect = useMutation({
    mutationFn: async () => {
      if (!me) throw new Error("Create your profile first");
      const { error } = await supabase
        .from("connections")
        .insert({ requester_id: me.id, addressee_id: id });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Connection request sent"),
    onError: (e: Error) => toast.error(e.message),
  });

  const requestMentorship = useMutation({
    mutationFn: async (payload: { topic: string; message: string }) => {
      if (!me) throw new Error("Create your profile first");
      const { error } = await supabase.from("mentorship_requests").insert({
        mentor_id: id,
        mentee_id: me.id,
        topic: payload.topic,
        message: payload.message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mentorship request sent");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={GraduationCap}
          title="Profile not available"
          description="This person may not be verified yet, or the profile was removed."
          action={
            <Button asChild variant="outline">
              <Link to="/alumni">Back to directory</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/alumni"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Directory
      </Link>

      <div className="card-surface overflow-hidden">
        <div className="bg-hero-gradient h-28" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <Avatar className="size-20 border-4 border-card">
                <AvatarImage src={data.avatar_url ?? undefined} alt="" />
                <AvatarFallback>{initials(data.full_name)}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="flex items-center gap-2 text-2xl font-bold">
                  {data.full_name}
                  {data.status === "verified" ? (
                    <BadgeCheck className="size-5 text-primary" aria-label="Verified alumni" />
                  ) : null}
                </h1>
                <p className="text-muted-foreground">{data.headline}</p>
              </div>
            </div>
            {session && me?.id !== data.id ? (
              <div className="flex gap-2 pb-1">
                <Button variant="outline" onClick={() => connect.mutate()} disabled={connect.isPending}>
                  <UserPlus className="size-4" /> Connect
                </Button>
                {data.is_mentor ? (
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <MessageSquarePlus className="size-4" /> Request mentorship
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request mentorship from {data.full_name}</DialogTitle>
                        <DialogDescription>
                          Be specific about what you need — short, clear requests get answered.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        className="space-y-4"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const f = new FormData(e.currentTarget);
                          requestMentorship.mutate({
                            topic: String(f.get("topic")),
                            message: String(f.get("message")),
                          });
                        }}
                      >
                        <div className="space-y-2">
                          <Label htmlFor="topic">Topic</Label>
                          <Input
                            id="topic"
                            name="topic"
                            required
                            defaultValue={data.mentor_topics[0] ?? ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">Message</Label>
                          <Textarea id="message" name="message" rows={4} required />
                        </div>
                        <Button type="submit" className="w-full" disabled={requestMentorship.isPending}>
                          Send request
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                About
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                {data.bio ?? "This alumnus hasn't written a bio yet."}
              </p>

              {data.skills.length ? (
                <>
                  <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Skills
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {data.skills.map((s) => (
                      <Badge key={s} variant="secondary" className="font-normal">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </>
              ) : null}

              {data.is_mentor && data.mentor_topics.length ? (
                <>
                  <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Mentors on
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {data.mentor_topics.map((t) => (
                      <Badge key={t} className="font-normal">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <aside className="space-y-3 text-sm text-muted-foreground">
              {data.job_title ? (
                <p className="flex items-start gap-2">
                  <Briefcase className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {data.job_title}
                    {data.company ? ` · ${data.company}` : ""}
                  </span>
                </p>
              ) : null}
              {data.location ? (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" /> {data.location}
                </p>
              ) : null}
              <p className="flex items-start gap-2">
                <GraduationCap className="mt-0.5 size-4 shrink-0" />
                {data.degree} · Class of {data.grad_year}
              </p>
              {data.linkedin_url ? (
                <a
                  href={data.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="size-4" /> LinkedIn
                </a>
              ) : null}
              {data.portfolio_url ? (
                <a
                  href={data.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="size-4" /> Portfolio
                </a>
              ) : null}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
