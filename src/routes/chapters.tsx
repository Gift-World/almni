import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe2, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/chapters")({
  head: () => ({ meta: [{ title: "Global chapters — AlumniConnect" }] }),
  component: ChaptersPage,
});

function ChaptersPage() {
  const { profile, session } = useAuth();
  const queryClient = useQueryClient();
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

  return (
    <PageShell
      title="Global chapters"
      subtitle="Find your university community wherever life takes you. Chapters are locally led, globally connected."
      action={
        <Button asChild variant="outline">
          <Link to="/map">
            <Globe2 className="size-4" /> View global map
          </Link>
        </Button>
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
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
