import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Briefcase, CalendarDays, HeartHandshake, ShieldAlert, Trash2, Users, Download, Send, LineChart, Mail, Database } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { RowsSkeleton } from "@/components/CardSkeletons";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { exactMoney, formatDate, initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "University Command Center — AlumniConnect" },
    ],
  }),
  component: AdminPage,
});

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function AdminPage() {
  const { isAdmin, profileLoading } = useAuth();
  const queryClient = useQueryClient();

  const [commTarget, setCommTarget] = useState("all");
  const [commSubject, setCommSubject] = useState("");
  const [commMessage, setCommMessage] = useState("");

  const users = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const pendingUsers = useMemo(() => {
    return users.data?.filter(u => u.status === "pending") || [];
  }, [users.data]);

  const verifiedUsers = useMemo(() => {
    return users.data?.filter(u => u.status === "verified") || [];
  }, [users.data]);

  const analytics = useQuery({
    queryKey: ["admin-analytics"],
    enabled: isAdmin,
    queryFn: async () => {
      const [jobs, events, rsvps, mentorships, donations, campaigns] =
        await Promise.all([
          supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("events").select("id", { count: "exact", head: true }),
          supabase.from("event_rsvps").select("id", { count: "exact", head: true }),
          supabase.from("mentorship_requests").select("id", { count: "exact", head: true }),
          supabase.from("donations").select("amount_cents"),
          supabase.from("campaigns").select("seed_raised_cents"),
        ]);
      const raised =
        (donations.data ?? []).reduce((s, d) => s + Number(d.amount_cents), 0) +
        (campaigns.data ?? []).reduce((s, c) => s + Number(c.seed_raised_cents), 0);
      const total = users.data?.length ?? 0;
      const engaged = (rsvps.count ?? 0) + (mentorships.count ?? 0);
      return {
        total,
        verified: verifiedUsers.length,
        jobs: jobs.count ?? 0,
        events: events.count ?? 0,
        raised,
        engagement: total ? Math.min(100, Math.round((engaged / total) * 100)) : 0,
      };
    },
  });

  const industryData = useMemo(() => {
    if (!verifiedUsers) return [];
    const counts: Record<string, number> = {};
    verifiedUsers.forEach(u => {
      const ind = u.industry || "Unspecified";
      counts[ind] = (counts[ind] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5
  }, [verifiedUsers]);

  const countryData = useMemo(() => {
    if (!verifiedUsers) return [];
    const counts: Record<string, number> = {};
    verifiedUsers.forEach(u => {
      const country = (u as any).country || "United States";
      counts[country] = (counts[country] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5
  }, [verifiedUsers]);

  const moderation = useQuery({
    queryKey: ["admin-jobs"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, company, created_at, is_active")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "verified" | "rejected" | "suspended" }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleJob = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("jobs").update({ is_active: !active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Listing updated");
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSendEmail = () => {
    if (!commSubject || !commMessage) {
      toast.error("Please fill in subject and message");
      return;
    }
    // Simulate sending email
    toast.success(`Campaign "${commSubject}" sent to ${commTarget === "all" ? "all alumni" : commTarget === "verified" ? "verified alumni" : "pending users"}!`);
    setCommSubject("");
    setCommMessage("");
  };

  const downloadCSV = () => {
    if (!users.data) return;
    const headers = ["ID", "Full Name", "Email", "Status", "Degree", "Grad Year", "Industry", "Location", "Country", "Created At"];
    const rows = users.data.map(u => [
      u.id, 
      `"${u.full_name || ""}"`, 
      `"${u.email || ""}"`, 
      u.status, 
      `"${u.degree || ""}"`, 
      u.grad_year, 
      `"${u.industry || ""}"`, 
      `"${u.location || ""}"`, 
      `"${(u as any).country || ""}"`, 
      u.created_at
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "alumni_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (profileLoading) return <RowsSkeleton />;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={ShieldAlert}
          title="Staff access only"
          description="This dashboard is limited to university staff accounts."
        />
      </div>
    );
  }

  const cards = [
    { label: "Total members", value: users.data?.length, icon: Users },
    { label: "Verified alumni", value: verifiedUsers.length, icon: BadgeCheck },
    { label: "Active job posts", value: analytics.data?.jobs, icon: Briefcase },
    { label: "Events", value: analytics.data?.events, icon: CalendarDays },
    {
      label: "Total raised",
      value: analytics.data ? exactMoney(analytics.data.raised) : undefined,
      icon: HeartHandshake,
    },
    {
      label: "Engagement rate",
      value: analytics.data ? `${analytics.data.engagement}%` : undefined,
      icon: Users,
    },
  ];

  return (
    <PageShell title="University Command Center" subtitle="Analytics, Communications, CRM, and Moderation">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card-surface p-5">
            <c.icon className="size-5 text-primary" />
            <p className="mt-3 font-display text-2xl font-bold">
              {c.value === undefined ? "—" : c.value}
            </p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="analytics" className="mt-10">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="analytics" className="flex items-center gap-2"><LineChart className="size-4" /> Analytics</TabsTrigger>
          <TabsTrigger value="crm" className="flex items-center gap-2"><Database className="size-4" /> CRM & Users</TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-2"><Mail className="size-4" /> Communications</TabsTrigger>
          <TabsTrigger value="queue">Queue{pendingUsers.length ? ` (${pendingUsers.length})` : ""}</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
           <div className="grid gap-6 md:grid-cols-2">
            <div className="card-surface p-6">
              <h3 className="font-semibold mb-6">Top Industries</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={industryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="card-surface p-6">
              <h3 className="font-semibold mb-6">Top Countries</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={countryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {countryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="crm" className="mt-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">User Data Management</h3>
            <Button onClick={downloadCSV} variant="outline" className="gap-2">
              <Download className="size-4" /> Export CSV
            </Button>
          </div>
          
          <div className="rounded-md border bg-card overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-5 border-b p-4 font-medium text-sm text-muted-foreground">
                <div className="col-span-2">User</div>
                <div>Grad Year</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {users.isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading users...</div>
              ) : users.data?.length === 0 ? (
                 <div className="p-8 text-center text-muted-foreground">No users found.</div>
              ) : (
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {users.data?.map(u => (
                    <div key={u.id} className="grid grid-cols-5 items-center p-4 text-sm">
                      <div className="col-span-2 flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarImage src={u.avatar_url ?? undefined} />
                          <AvatarFallback>{initials(u.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{u.full_name}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </div>
                      <div>{u.grad_year || "—"}</div>
                      <div>
                        <Badge variant={u.status === "verified" ? "default" : u.status === "pending" ? "secondary" : "destructive"}>
                          {u.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Select 
                          value={u.status} 
                          onValueChange={(val: any) => setStatus.mutate({ id: u.id, status: val })}
                        >
                          <SelectTrigger className="h-8 w-[120px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="communications" className="mt-6">
          <div className="card-surface p-6 max-w-2xl">
            <h3 className="text-lg font-semibold mb-2">Targeted Email Campaign</h3>
            <p className="text-sm text-muted-foreground mb-6">Send a bulk email to your alumni base. (Simulation)</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Audience</label>
                <Select value={commTarget} onValueChange={setCommTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users ({users.data?.length || 0})</SelectItem>
                    <SelectItem value="verified">Verified Alumni ({verifiedUsers.length})</SelectItem>
                    <SelectItem value="pending">Pending Verification ({pendingUsers.length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject Line</label>
                <Input 
                  placeholder="e.g. Join us for Homecoming 2026!" 
                  value={commSubject}
                  onChange={e => setCommSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message Body</label>
                <Textarea 
                  placeholder="Write your email content here..." 
                  className="min-h-[200px]"
                  value={commMessage}
                  onChange={e => setCommMessage(e.target.value)}
                />
              </div>

              <Button onClick={handleSendEmail} className="w-full gap-2">
                <Send className="size-4" /> Send Campaign
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="mt-6 space-y-3">
          {users.isLoading ? (
            <RowsSkeleton count={3} />
          ) : pendingUsers.length === 0 ? (
            <EmptyState
              icon={BadgeCheck}
              title="Queue is clear"
              description="Every alumni account has been reviewed. New signups will land here."
            />
          ) : (
            pendingUsers.map((p) => (
              <div key={p.id} className="card-surface flex flex-wrap items-center gap-4 p-5">
                <Avatar className="size-11">
                  <AvatarImage src={p.avatar_url ?? undefined} alt="" />
                  <AvatarFallback>{initials(p.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.full_name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {p.degree} · Class of {p.grad_year} · {p.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setStatus.mutate({ id: p.id, status: "verified" })}>
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus.mutate({ id: p.id, status: "rejected" })}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="moderation" className="mt-6 space-y-3">
          {moderation.isLoading ? (
            <RowsSkeleton count={3} />
          ) : (
            moderation.data?.map((j) => (
              <div key={j.id} className="card-surface flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-medium">{j.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {j.company} · posted {formatDate(j.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={j.is_active ? "default" : "secondary"}>
                    {j.is_active ? "Live" : "Hidden"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleJob.mutate({ id: j.id, active: j.is_active })}
                  >
                    <Trash2 className="size-4" /> {j.is_active ? "Hide" : "Restore"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
