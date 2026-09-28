import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe2, MapPin, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/chapters")({
  head: () => ({ meta: [{ title: "Global chapters — AlumniConnect" }] }),
  component: ChaptersPage,
});

function ChaptersPage() {
  const { profile, session, staffRoles, isAdmin } = useAuth();
  const canManageChapters = isAdmin || staffRoles.includes("chapter_manager");
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const chapters = useQuery({
    queryKey: ["chapters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("*, chapter_members(profile_id)")
        .eq("is_active", true)
        .order("country")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const join = useMutation({
    mutationFn: async (chapterId: string) => {
      if (!profile) throw new Error("Complete your profile before joining a chapter");
      const { error } = await supabase
        .from("chapter_members")
        .insert({ chapter_id: chapterId, profile_id: profile.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("You joined the chapter");
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const createChapter = useMutation({
    mutationFn: async (form: FormData) => {
      if (!profile) throw new Error("Create your profile before launching a chapter");
      const name = String(form.get("name")).trim();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!name || !slug) throw new Error("A chapter name is required");
      // The RPC is introduced by this release migration; isolate the generated-type gap
      // until production types are regenerated after the migration is applied.
      const { error } = await (supabase as any).rpc("launch_chapter", {
        _name: name,
        _slug: slug,
        _city: String(form.get("city")).trim(),
        _country: String(form.get("country")).trim(),
        _timezone: String(form.get("timezone")).trim() || "UTC",
        _description: String(form.get("description")).trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Chapter launched with you as its local leader.");
      setCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["chapters"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageShell
      title="Global chapters"
      subtitle="Find your university community wherever life takes you. Chapters are locally led, globally connected."
      action={
        <div className="flex gap-2">
          {canManageChapters ? <Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Launch chapter</Button> : null}
          <Button asChild variant="outline"><Link to="/map"><Globe2 className="size-4" /> View global map</Link></Button>
        </div>
      }
    >
      {chapters.isLoading ? null : chapters.data?.length === 0 ? (
        <EmptyState
          icon={Globe2}
          title="No chapters are live yet"
          description="University staff can launch city, country, industry and affinity chapters from the command center."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chapters.data?.map((chapter) => {
            const joined =
              !!profile &&
              chapter.chapter_members.some(
                (member: { profile_id: string }) => member.profile_id === profile.id,
              );
            return (
              <article key={chapter.id} className="card-surface flex flex-col p-5">
                <div className="flex flex-1 items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{chapter.name}</h2>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" /> {chapter.city ? `${chapter.city}, ` : ""}
                      {chapter.country}
                    </p>
                  </div>
                  <Badge variant="secondary">{chapter.timezone}</Badge>
                </div>
                <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">
                  {chapter.description ??
                    "A local community for alumni to meet, share opportunities and support one another."}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="size-4" /> {chapter.chapter_members.length} members
                  </span>
                  {session ? (
                    <Button
                      size="sm"
                      variant={joined ? "secondary" : "default"}
                      disabled={joined || join.isPending}
                      onClick={() => join.mutate(chapter.id)}
                    >
                      {joined ? "Joined" : "Join chapter"}
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/auth">Sign in</Link>
                    </Button>
                  )}
                </div>
                {canManageChapters ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Staff view · {chapter.chapter_members.length} active members · leadership managed in command center.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Launch a global embassy</DialogTitle><DialogDescription>Create a trusted local chapter and begin with yourself as its volunteer leader.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); createChapter.mutate(new FormData(event.currentTarget)); }}>
            <div className="space-y-1"><Label htmlFor="chapter-name">Chapter name</Label><Input id="chapter-name" name="name" placeholder="London Alumni Chapter" required /></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="chapter-city">City</Label><Input id="chapter-city" name="city" placeholder="London" /></div><div className="space-y-1"><Label htmlFor="chapter-country">Country</Label><Input id="chapter-country" name="country" placeholder="United Kingdom" required /></div></div>
            <div className="space-y-1"><Label htmlFor="chapter-timezone">Time zone</Label><Input id="chapter-timezone" name="timezone" placeholder="Europe/London" required /></div>
            <div className="space-y-1"><Label htmlFor="chapter-description">Purpose</Label><Textarea id="chapter-description" name="description" placeholder="What will this community help alumni do?" rows={3} /></div>
            <Button type="submit" className="w-full" disabled={createChapter.isPending}>Launch chapter</Button>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
