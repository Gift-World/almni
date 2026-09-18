import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Inbox, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { RowsSkeleton } from "@/components/CardSkeletons";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({
    meta: [
      { title: "Requests & messages — AlumniConnect" },
      {
        name: "description",
        content: "Your mentorship threads and connection requests in one inbox.",
      },
      { property: "og:title", content: "Requests & messages — AlumniConnect" },
      { property: "og:description", content: "Accept, decline and reply to alumni requests." },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [openThread, setOpenThread] = useState<string | null>(null);

  const mentorship = useQuery({
    queryKey: ["mentorship-requests", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorship_requests")
        .select(
          "*, mentor:profiles!mentorship_requests_mentor_id_fkey(id, full_name), mentee:profiles!mentorship_requests_mentee_id_fkey(id, full_name)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const connections = useQuery({
    queryKey: ["connection-requests", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connections")
        .select(
          "*, requester:profiles!connections_requester_id_fkey(id, full_name), addressee:profiles!connections_addressee_id_fkey(id, full_name)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const messages = useQuery({
    queryKey: ["thread", openThread],
    enabled: !!openThread,
    queryFn: async () => {
      const { data } = await supabase
        .from("mentorship_messages")
        .select("*, sender:profiles!mentorship_messages_sender_id_fkey(full_name)")
        .eq("request_id", openThread!)
        .order("created_at");
      return data ?? [];
    },
  });

  const respondMentorship = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "declined" }) => {
      const { error } = await supabase.from("mentorship_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorship-requests"] });
      toast.success("Response sent");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const respondConnection = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "declined" }) => {
      const { error } = await supabase.from("connections").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-requests"] });
      toast.success("Response sent");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMessage = useMutation({
    mutationFn: async ({ requestId, body }: { requestId: string; body: string }) => {
      const { error } = await supabase
        .from("mentorship_messages")
        .insert({ request_id: requestId, sender_id: profile!.id, body });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["thread", openThread] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageShell title="Requests & messages" subtitle="Everything waiting on you, in one place.">
      <Tabs defaultValue="mentorship">
        <TabsList>
          <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="mentorship" className="mt-6 space-y-3">
          {mentorship.isLoading ? (
            <RowsSkeleton />
          ) : mentorship.data?.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No mentorship requests yet"
              description="Browse mentors and send your first request — most people reply within a week."
            />
          ) : (
            mentorship.data?.map((r) => {
              const iAmMentor = r.mentor_id === profile?.id;
              const other = iAmMentor ? r.mentee : r.mentor;
              return (
                <div key={r.id} className="card-surface p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {r.topic}{" "}
                        <span className="font-normal text-muted-foreground">
                          · {iAmMentor ? "from" : "to"} {other?.full_name}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                    </div>
                    <Badge
                      variant={
                        r.status === "accepted"
                          ? "default"
                          : r.status === "declined"
                            ? "destructive"
                            : "secondary"
                      }
                      className="capitalize"
                    >
                      {r.status}
                    </Badge>
                  </div>
                  {r.message ? (
                    <p className="mt-3 text-sm text-muted-foreground">{r.message}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {iAmMentor && r.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => respondMentorship.mutate({ id: r.id, status: "accepted" })}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => respondMentorship.mutate({ id: r.id, status: "declined" })}
                        >
                          Decline
                        </Button>
                      </>
                    ) : null}
                    {r.status === "accepted" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenThread(openThread === r.id ? null : r.id)}
                      >
                        {openThread === r.id ? "Hide thread" : "Open thread"}
                      </Button>
                    ) : null}
                  </div>

                  {openThread === r.id ? (
                    <div className="mt-4 space-y-3 rounded-lg border border-border p-4">
                      {messages.isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading messages…</p>
                      ) : messages.data?.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No messages yet — say hello and suggest a time.
                        </p>
                      ) : (
                        messages.data?.map((m) => (
                          <div key={m.id} className="text-sm">
                            <span className="font-medium">{m.sender?.full_name}: </span>
                            <span className="text-muted-foreground">{m.body}</span>
                          </div>
                        ))
                      )}
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const input = e.currentTarget.elements.namedItem(
                            "body",
                          ) as HTMLInputElement;
                          if (!input.value.trim()) return;
                          sendMessage.mutate({ requestId: r.id, body: input.value });
                          input.value = "";
                        }}
                      >
                        <Input name="body" placeholder="Write a message…" />
                        <Button type="submit" size="icon" aria-label="Send">
                          <Send className="size-4" />
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="connections" className="mt-6 space-y-3">
          {connections.isLoading ? (
            <RowsSkeleton count={3} />
          ) : connections.data?.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No connections yet"
              description="Open the directory and connect with a few classmates to get started."
            />
          ) : (
            connections.data?.map((c) => {
              const incoming = c.addressee_id === profile?.id;
              const other = incoming ? c.requester : c.addressee;
              return (
                <div key={c.id} className="card-surface flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <p className="font-medium">{other?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {incoming ? "Wants to connect" : "Request sent"} · {formatDate(c.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === "accepted" ? "default" : "secondary"} className="capitalize">
                      {c.status}
                    </Badge>
                    {incoming && c.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => respondConnection.mutate({ id: c.id, status: "accepted" })}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => respondConnection.mutate({ id: c.id, status: "declined" })}
                        >
                          Decline
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
