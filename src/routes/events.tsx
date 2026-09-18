import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Check, MapPin, Plus, Users, Video } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CardGridSkeleton } from "@/components/CardSkeletons";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/format";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Alumni events — AlumniConnect" },
      {
        name: "description",
        content:
          "Reunions, webinars and city networking nights with live RSVP counts, plus an archive of past events.",
      },
      { property: "og:title", content: "Alumni events — AlumniConnect" },
      {
        property: "og:description",
        content: "RSVP to reunions, webinars and networking nights near you.",
      },
    ],
  }),
  component: EventsPage,
});

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location: string | null;
  is_virtual: boolean;
  cover_image_url: string | null;
  starts_at: string;
};

function EventsPage() {
  const { session, profile } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const events = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, event_rsvps(profile_id)")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const rsvp = useMutation({
    mutationFn: async ({ eventId, going }: { eventId: string; going: boolean }) => {
      if (!profile) throw new Error("Create your profile first");
      if (going) {
        const { error } = await supabase
          .from("event_rsvps")
          .delete()
          .eq("event_id", eventId)
          .eq("profile_id", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .insert({ event_id: eventId, profile_id: profile.id });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const createEvent = useMutation({
    mutationFn: async (form: FormData) => {
      if (!profile) throw new Error("Create your profile first");
      const { error } = await supabase.from("events").insert({
        created_by: profile.id,
        title: String(form.get("title")),
        description: String(form.get("description")),
        category: String(form.get("category")),
        location: String(form.get("location")),
        is_virtual: form.get("is_virtual") === "on",
        starts_at: new Date(String(form.get("starts_at"))).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event created");
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const now = Date.now();
  const all = events.data ?? [];
  const upcoming = all.filter((e) => new Date(e.starts_at).getTime() >= now);
  const past = all
    .filter((e) => new Date(e.starts_at).getTime() < now)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

  function Card({ event, isPast }: { event: EventRow & { event_rsvps: { profile_id: string }[] }; isPast?: boolean }) {
    const going = !!profile && event.event_rsvps.some((r) => r.profile_id === profile.id);
    return (
      <article className="card-surface card-interactive flex flex-col overflow-hidden">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            loading="lazy"
            className="h-40 w-full object-cover"
          />
        ) : null}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{event.category}</Badge>
            {event.is_virtual ? (
              <Badge variant="outline" className="gap-1">
                <Video className="size-3" /> Online
              </Badge>
            ) : null}
          </div>
          <h3 className="mt-3 font-semibold">{event.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5" /> {formatDate(event.starts_at)} ·{" "}
            {formatTime(event.starts_at)}
          </p>
          {event.location ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {event.location}
            </p>
          ) : null}
          <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted-foreground">{event.description}</p>
          <div className="mt-5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-4" /> {event.event_rsvps.length}{" "}
              {isPast ? "attended" : "going"}
            </span>
            {isPast ? null : session ? (
              <Button
                size="sm"
                variant={going ? "secondary" : "default"}
                onClick={() => rsvp.mutate({ eventId: event.id, going })}
                disabled={rsvp.isPending}
              >
                {going ? (
                  <>
                    <Check className="size-4" /> Going
                  </>
                ) : (
                  "RSVP"
                )}
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link to="/auth">Sign in to RSVP</Link>
              </Button>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <PageShell
      title="Events"
      subtitle="Reunions, webinars and city meetups. RSVP counts update live."
      action={
        session ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Create event
          </Button>
        ) : null
      }
    >
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past events</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {events.isLoading ? (
            <CardGridSkeleton />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing on the calendar yet"
              description="Be the first to host something — a coffee meetup counts."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <Card key={e.id} event={e} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {events.isLoading ? (
            <CardGridSkeleton />
          ) : past.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No past events yet"
              description="Once events wrap up, they'll be archived here with attendance."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((e) => (
                <Card key={e.id} event={e} isPast />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create an event</DialogTitle>
            <DialogDescription>Alumni and staff can host events for the network.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createEvent.mutate(new FormData(e.currentTarget));
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="e-title">Title</Label>
              <Input id="e-title" name="title" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="e-category">Category</Label>
                <select
                  id="e-category"
                  name="category"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option>Networking</option>
                  <option>Reunion</option>
                  <option>Webinar</option>
                  <option>Workshop</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-start">Starts</Label>
                <Input id="e-start" name="starts_at" type="datetime-local" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-location">Location</Label>
              <Input id="e-location" name="location" required />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_virtual" className="size-4" /> This is an online event
            </label>
            <div className="space-y-2">
              <Label htmlFor="e-desc">Description</Label>
              <Textarea id="e-desc" name="description" rows={4} required />
            </div>
            <Button type="submit" className="w-full" disabled={createEvent.isPending}>
              Create event
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
