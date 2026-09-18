import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartHandshake, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CardGridSkeleton } from "@/components/CardSkeletons";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Profile } from "@/lib/auth";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/mentorship")({
  head: () => ({
    meta: [
      { title: "Find a mentor — AlumniConnect" },
      {
        name: "description",
        content:
          "Alumni who opted in to mentor, with the exact topics they can help on. Send a request and start a thread.",
      },
      { property: "og:title", content: "Mentorship matching — AlumniConnect" },
      {
        property: "og:description",
        content: "Browse alumni mentors by topic and send a focused request.",
      },
    ],
  }),
  component: MentorshipPage,
});

const ALL = "__all__";

function MentorshipPage() {
  const { session, profile } = useAuth();
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState(ALL);
  const [target, setTarget] = useState<Profile | null>(null);

  const mentors = useQuery({
    queryKey: ["mentors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("status", "verified")
        .eq("is_mentor", true)
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const request = useMutation({
    mutationFn: async (payload: { mentorId: string; topic: string; message: string }) => {
      if (!profile) throw new Error("Create your profile first");
      const { error } = await supabase.from("mentorship_requests").insert({
        mentor_id: payload.mentorId,
        mentee_id: profile.id,
        topic: payload.topic,
        message: payload.message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request sent — you'll see the reply under Requests");
      setTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const topics = useMemo(
    () => [...new Set((mentors.data ?? []).flatMap((m) => m.mentor_topics))].sort(),
    [mentors.data],
  );

  const results = (mentors.data ?? []).filter((m) => {
    const hay = `${m.full_name} ${m.company} ${m.job_title} ${m.mentor_topics.join(" ")}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (topic !== ALL && !m.mentor_topics.includes(topic)) return false;
    return true;
  });

  return (
    <PageShell
      title="Mentorship"
      subtitle="These alumni volunteered their time and named the topics they can genuinely help with."
      action={
        session ? (
          <Button asChild variant="outline">
            <Link to="/requests">My requests</Link>
          </Button>
        ) : null
      }
    >
      <div className="card-surface mb-6 grid gap-3 p-4 md:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search mentors…"
            className="pl-9"
          />
        </div>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger>
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All topics</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {mentors.isLoading ? (
        <CardGridSkeleton />
      ) : results.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="No mentors on that topic yet"
          description="Try another topic, or opt in as a mentor yourself from your profile."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((m) => (
            <article key={m.id} className="card-surface card-interactive flex flex-col p-5">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarImage src={m.avatar_url ?? undefined} alt="" />
                  <AvatarFallback>{initials(m.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{m.full_name}</h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {m.job_title} · {m.company}
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{m.bio}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {m.mentor_topics.map((t) => (
                  <Badge key={t} variant="secondary" className="font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="mt-5 flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to="/alumni/$id" params={{ id: m.id }}>
                    Profile
                  </Link>
                </Button>
                {session ? (
                  <Button size="sm" className="flex-1" onClick={() => setTarget(m)}>
                    Request
                  </Button>
                ) : (
                  <Button asChild size="sm" className="flex-1">
                    <Link to="/auth">Sign in</Link>
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request mentorship from {target?.full_name}</DialogTitle>
            <DialogDescription>
              One clear ask beats a long introduction. Mention where you are and what you need.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (!target) return;
              request.mutate({
                mentorId: target.id,
                topic: String(f.get("topic")),
                message: String(f.get("message")),
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="m-topic">Topic</Label>
              <Input
                id="m-topic"
                name="topic"
                required
                defaultValue={target?.mentor_topics[0] ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-message">Message</Label>
              <Textarea id="m-message" name="message" rows={4} required />
            </div>
            <Button type="submit" className="w-full" disabled={request.isPending}>
              Send request
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
