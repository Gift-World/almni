import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  HeartHandshake,
  ShieldAlert,
  Trash2,
  Users,
  Download,
  LineChart,
  Mail,
  Database,
  ShieldCheck,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { RowsSkeleton } from "@/components/CardSkeletons";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { exactMoney, formatDate, initials } from "@/lib/format";
import { useWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "University Command Center — AlumniConnect" }],
  }),
  component: AdminPage,
});

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];
type PrivacyQueueItem = {
  id: string;
  profile_id: string;
  request_type: "export" | "delete";
  status: "pending" | "in_progress" | "completed" | "declined";
  created_at: string;
};
const staffRoles = [
  ["alumni_relations", "Alumni relations"], ["advancement", "Advancement"],
  ["careers", "Careers"], ["events", "Events"], ["communications", "Communications"],
  ["chapter_manager", "Chapter manager"], ["analyst", "Analyst"], ["read_only", "Read-only"],
] as const;
const integrationProviders = [
  ["salesforce", "Salesforce"], ["raisers_edge", "Raiser’s Edge"], ["banner", "Ellucian Banner"],
  ["workday", "Workday"], ["custom", "Custom SIS / CRM"],
] as const;
type IntegrationConnection = {
  id: string; provider: string; display_name: string; state: "draft" | "active" | "paused" | "error";
  secret_reference: string | null; last_synced_at: string | null; created_at: string;
};
type AiRecommendation = {
  id: string; profile_id: string; recommendation_type: string; rationale: string;
  status: "draft" | "pending_approval" | "approved" | "rejected" | "expired"; created_at: string;
};
const ssoProviders = [["saml", "SAML 2.0"], ["oidc", "OpenID Connect"], ["azure_ad", "Microsoft Entra ID"], ["google_workspace", "Google Workspace"]] as const;
type SsoConfiguration = { id: string; provider: string; email_domain: string; display_name: string; issuer_reference: string | null; enabled: boolean };

function AdminPage() {
  const { isAdmin, profileLoading, profile } = useAuth();
  const { mode, setMode } = useWorkspace();
  const queryClient = useQueryClient();

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
    return users.data?.filter((u) => u.status === "pending") || [];
  }, [users.data]);

  const verifiedUsers = useMemo(() => {
    return users.data?.filter((u) => u.status === "verified") || [];
  }, [users.data]);

  const analytics = useQuery({
    queryKey: ["admin-analytics"],
    enabled: isAdmin,
    queryFn: async () => {
      const [jobs, events, rsvps, mentorships, donations, campaigns] = await Promise.all([
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
    verifiedUsers.forEach((u) => {
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
    verifiedUsers.forEach((u) => {
      const country =
        "country" in u && typeof u.country === "string" && u.country.length > 0
          ? u.country
          : "Unspecified";
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

  const operations = useQuery({
    queryKey: ["admin-operations"],
    enabled: isAdmin,
    queryFn: async () => {
      const [privacy, integrations, audit] = await Promise.all([
        supabase.from("privacy_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("integration_connections").select("id", { count: "exact", head: true }).eq("state", "error"),
        supabase.from("audit_events").select("id", { count: "exact", head: true }),
      ]);
      return { pendingPrivacy: privacy.count ?? 0, integrationErrors: integrations.count ?? 0, auditEvents: audit.count ?? 0 };
    },
  });

  const privacyQueue = useQuery({
    queryKey: ["admin-privacy-queue"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("privacy_requests")
        .select("id, profile_id, request_type, status, created_at")
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as PrivacyQueueItem[];
    },
  });

  const staffInvitations = useQuery({
    queryKey: ["admin-staff-invitations"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await (supabase.from("staff_invitations") as any)
        .select("id, email, staff_role, expires_at, accepted_at, created_at")
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as { id: string; email: string; staff_role: string | null; expires_at: string; accepted_at: string | null; created_at: string }[];
    },
  });

  const integrations = useQuery({
    queryKey: ["admin-integrations"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await (supabase.from("integration_connections") as any)
        .select("id, provider, display_name, state, secret_reference, last_synced_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as IntegrationConnection[];
    },
  });

  const aiReviewQueue = useQuery({
    queryKey: ["admin-ai-review-queue"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await (supabase.from("ai_recommendations") as any)
        .select("id, profile_id, recommendation_type, rationale, status, created_at")
        .eq("status", "pending_approval")
        .order("created_at", { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as AiRecommendation[];
    },
  });

  const ssoConfigurations = useQuery({
    queryKey: ["admin-sso-configurations"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await (supabase.from("institutional_sso_configurations") as any)
        .select("id, provider, email_domain, display_name, issuer_reference, enabled")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SsoConfiguration[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "pending" | "verified" | "rejected" | "suspended";
    }) => {
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

  const updatePrivacyRequest = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "in_progress" | "completed" | "declined" }) => {
      const { error } = await supabase.from("privacy_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Privacy request updated");
      void queryClient.invalidateQueries({ queryKey: ["admin-privacy-queue"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-operations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const inviteStaff = useMutation({
    mutationFn: async (form: FormData) => {
      if (!profile) throw new Error("Your staff profile is still loading");
      const email = String(form.get("staff_email")).trim().toLowerCase();
      const staffRole = String(form.get("staff_role"));
      if (!email || !staffRole) throw new Error("Email and staff responsibility are required");
      const { error } = await (supabase.from("staff_invitations") as any).upsert({
        email, role: "admin", staff_role: staffRole, invited_by: profile.id,
      }, { onConflict: "tenant_id,email" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Staff invitation recorded with its assigned responsibility.");
      void queryClient.invalidateQueries({ queryKey: ["admin-staff-invitations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createIntegration = useMutation({
    mutationFn: async (form: FormData) => {
      const displayName = String(form.get("integration_name")).trim();
      const provider = String(form.get("integration_provider"));
      const secretReference = String(form.get("secret_reference")).trim();
      if (!displayName || !provider) throw new Error("Provider and connection name are required");
      const { error } = await (supabase.from("integration_connections") as any).insert({
        provider, display_name: displayName, state: "draft", secret_reference: secretReference || null,
        field_mapping: { alumni_profile: "profiles", engagement: "event_rsvps" },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Integration saved as a draft. Add credentials in the deployment secret manager before activation.");
      void queryClient.invalidateQueries({ queryKey: ["admin-integrations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reviewAiRecommendation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      if (!profile) throw new Error("Your staff profile is still loading");
      const { error } = await (supabase.from("ai_recommendations") as any)
        .update({ status, reviewed_by: profile.id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recommendation review recorded.");
      void queryClient.invalidateQueries({ queryKey: ["admin-ai-review-queue"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const enrollSso = useMutation({
    mutationFn: async (form: FormData) => {
      if (!profile) throw new Error("Your staff profile is still loading");
      const emailDomain = String(form.get("sso_domain")).trim().toLowerCase().replace(/^@/, "");
      const displayName = String(form.get("sso_name")).trim();
      const provider = String(form.get("sso_provider"));
      const issuerReference = String(form.get("sso_issuer_reference")).trim();
      if (!emailDomain.includes(".") || !displayName) throw new Error("Enter a valid university email domain and connection name");
      const { error } = await (supabase.from("institutional_sso_configurations") as any).upsert({
        provider, email_domain: emailDomain, display_name: displayName, issuer_reference: issuerReference || null,
        enabled: false, created_by: profile.id,
      }, { onConflict: "tenant_id,email_domain" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("SSO enrollment saved as a draft. Complete the IdP setup before activation.");
      void queryClient.invalidateQueries({ queryKey: ["admin-sso-configurations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const downloadCSV = () => {
    if (!users.data) return;
    const headers = [
      "ID",
      "Full Name",
      "Email",
      "Status",
      "Degree",
      "Grad Year",
      "Industry",
      "Location",
      "Country",
      "Created At",
    ];
    const rows = users.data.map((u) => [
      u.id,
      `"${u.full_name || ""}"`,
      `"${u.email || ""}"`,
      u.status,
      `"${u.degree || ""}"`,
      u.grad_year,
      `"${u.industry || ""}"`,
      `"${u.location || ""}"`,
      `"${"country" in u && typeof u.country === "string" ? u.country : ""}"`,
      u.created_at,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="mx-auto max-w-md text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Staff access only
          </h1>
          <p className="mt-2 text-muted-foreground">
            This dashboard is limited to university staff accounts.
          </p>
        </div>
      </div>
    );
  }

  if (mode !== "staff") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="card-surface max-w-lg p-8 text-center">
          <h1 className="text-2xl font-bold">You’re in your alumni view</h1>
          <p className="mt-3 text-muted-foreground">
            Your member experience stays separate from university operations. Switch workspaces when
            you’re ready to manage the network.
          </p>
          <Button className="mt-6" onClick={() => setMode("staff")}>
            Open staff workspace
          </Button>
        </div>
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
    <PageShell
      title="University Command Center"
      subtitle="Analytics, Communications, CRM, and Moderation"
    >
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
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <LineChart className="size-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="crm" className="flex items-center gap-2">
            <Database className="size-4" /> CRM & Users
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-2">
            <Mail className="size-4" /> Communications
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <ShieldCheck className="size-4" /> Operations
          </TabsTrigger>
          <TabsTrigger value="queue">
            Queue{pendingUsers.length ? ` (${pendingUsers.length})` : ""}
          </TabsTrigger>
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
                    <Tooltip cursor={{ fill: "transparent" }} />
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
                  {users.data?.map((u) => (
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
                        <Badge
                          variant={
                            u.status === "verified"
                              ? "default"
                              : u.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {u.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={u.status}
                          onValueChange={(val) => {
                            if (["pending", "verified", "rejected", "suspended"].includes(val)) {
                              setStatus.mutate({
                                id: u.id,
                                status: val as "pending" | "verified" | "rejected" | "suspended",
                              });
                            }
                          }}
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
            <h3 className="text-lg font-semibold mb-2">Communications</h3>
            <p className="text-sm text-muted-foreground">
              Bulk email is intentionally unavailable until a university-owned delivery provider,
              consent rules, unsubscribe handling, and audit logging are configured.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card-surface p-5">
              <h3 className="font-semibold">Staff access</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Invite and assign alumni relations, careers, events, communications and chapter roles.
              </p>
            </div>
            <div className="card-surface p-5">
              <h3 className="font-semibold">Privacy requests</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {operations.data?.pendingPrivacy ?? "—"} pending export or deletion requests.
              </p>
            </div>
            <div className="card-surface p-5">
              <h3 className="font-semibold">Integrations</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {operations.data?.integrationErrors ?? "—"} connections need attention · {operations.data?.auditEvents ?? "—"} audit events.
              </p>
            </div>
          </div>
          <div className="card-surface mt-6 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Privacy request queue</h3>
                <p className="mt-1 text-sm text-muted-foreground">Review requests in a controlled workflow. Completing a request records its resolution timestamp; it never deletes data automatically.</p>
              </div>
              <Badge variant="secondary">{privacyQueue.data?.length ?? 0} open</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {privacyQueue.isLoading ? <RowsSkeleton count={2} /> : privacyQueue.data?.length ? privacyQueue.data.map((request) => (
                <div key={request.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize">{request.request_type} request</p>
                    <p className="text-xs text-muted-foreground">Received {formatDate(request.created_at)} · Member reference {request.profile_id.slice(0, 8)}</p>
                  </div>
                  <Badge variant={request.status === "pending" ? "outline" : "secondary"}>{request.status.replace("_", " ")}</Badge>
                  {request.status === "pending" ? <Button size="sm" variant="outline" disabled={updatePrivacyRequest.isPending} onClick={() => updatePrivacyRequest.mutate({ id: request.id, status: "in_progress" })}>Start review</Button> : null}
                  <Button size="sm" disabled={updatePrivacyRequest.isPending} onClick={() => updatePrivacyRequest.mutate({ id: request.id, status: "completed" })}>Mark complete</Button>
                  <Button size="sm" variant="ghost" disabled={updatePrivacyRequest.isPending} onClick={() => updatePrivacyRequest.mutate({ id: request.id, status: "declined" })}>Decline</Button>
                </div>
              )) : <p className="py-4 text-sm text-muted-foreground">No open privacy requests.</p>}
            </div>
          </div>
          <div className="card-surface mt-6 p-5">
            <h3 className="font-semibold">Invite university staff</h3>
            <p className="mt-1 text-sm text-muted-foreground">Assign the least-privileged responsibility before staff accept access. The invitation record is ready for the institution’s configured email-delivery service.</p>
            <form className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]" onSubmit={(event) => { event.preventDefault(); inviteStaff.mutate(new FormData(event.currentTarget)); }}>
              <div className="space-y-1"><Label htmlFor="staff-email">Staff email</Label><Input id="staff-email" name="staff_email" type="email" placeholder="name@university.edu" required /></div>
              <div className="space-y-1"><Label htmlFor="staff-role">Responsibility</Label><select id="staff-role" name="staff_role" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" defaultValue="alumni_relations">{staffRoles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <Button className="self-end" type="submit" disabled={inviteStaff.isPending}>Record invitation</Button>
            </form>
            {staffInvitations.data?.length ? <div className="mt-5 space-y-2">{staffInvitations.data.map((invite) => <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"><span className="font-medium">{invite.email}</span><span className="text-muted-foreground">{staffRoles.find(([role]) => role === invite.staff_role)?.[1] ?? "Staff"}</span><Badge variant={invite.accepted_at ? "secondary" : "outline"}>{invite.accepted_at ? "Accepted" : "Pending"}</Badge></div>)}</div> : null}
          </div>
          <div className="card-surface mt-6 p-5">
            <h3 className="font-semibold">University single sign-on</h3>
            <p className="mt-1 text-sm text-muted-foreground">Enroll your institution’s domain and provider. Activation remains disabled until the university identity team configures the corresponding credentials and certificate metadata in the authentication provider.</p>
            <form className="mt-4 grid gap-3 lg:grid-cols-[180px_1fr_1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); enrollSso.mutate(new FormData(event.currentTarget)); }}>
              <div className="space-y-1"><Label htmlFor="sso-provider">Provider</Label><select id="sso-provider" name="sso_provider" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" defaultValue="saml">{ssoProviders.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="space-y-1"><Label htmlFor="sso-domain">Email domain</Label><Input id="sso-domain" name="sso_domain" placeholder="university.edu" required /></div>
              <div className="space-y-1"><Label htmlFor="sso-name">Connection name</Label><Input id="sso-name" name="sso_name" placeholder="University SSO" required /></div>
              <div className="space-y-1"><Label htmlFor="sso-issuer">Issuer / config reference</Label><Input id="sso-issuer" name="sso_issuer_reference" placeholder="idp-university-saml" /></div>
              <Button className="self-end" type="submit" disabled={enrollSso.isPending}>Save draft</Button>
            </form>
            {ssoConfigurations.data?.length ? <div className="mt-5 space-y-2">{ssoConfigurations.data.map((config) => <div key={config.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"><span className="font-medium">{config.display_name}</span><span className="text-muted-foreground">@{config.email_domain} · {ssoProviders.find(([provider]) => provider === config.provider)?.[1] ?? config.provider}</span><Badge variant={config.enabled ? "secondary" : "outline"}>{config.enabled ? "Active" : "Draft"}</Badge></div>)}</div> : null}
          </div>
          <div className="card-surface mt-6 p-5">
            <h3 className="font-semibold">CRM and SIS connections</h3>
            <p className="mt-1 text-sm text-muted-foreground">Register a connection without storing a password, API key, or token in the application database. Credentials belong in the deployment secret manager.</p>
            <form className="mt-4 grid gap-3 lg:grid-cols-[190px_1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); createIntegration.mutate(new FormData(event.currentTarget)); }}>
              <div className="space-y-1"><Label htmlFor="integration-provider">Provider</Label><select id="integration-provider" name="integration_provider" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" defaultValue="salesforce">{integrationProviders.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="space-y-1"><Label htmlFor="integration-name">Connection name</Label><Input id="integration-name" name="integration_name" placeholder="Advancement CRM" required /></div>
              <div className="space-y-1"><Label htmlFor="integration-secret">Secret reference</Label><Input id="integration-secret" name="secret_reference" placeholder="e.g. SALESFORCE_ADVANCEMENT" /></div>
              <Button className="self-end" type="submit" disabled={createIntegration.isPending}>Save draft</Button>
            </form>
            <div className="mt-5 space-y-2">
              {integrations.isLoading ? <RowsSkeleton count={2} /> : integrations.data?.length ? integrations.data.map((integration) => <div key={integration.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"><div><span className="font-medium">{integration.display_name}</span><span className="ml-2 text-muted-foreground">{integrationProviders.find(([provider]) => provider === integration.provider)?.[1] ?? integration.provider}</span></div><span className="text-muted-foreground">{integration.last_synced_at ? `Last sync ${formatDate(integration.last_synced_at)}` : "Not synced yet"}</span><Badge variant={integration.state === "error" ? "destructive" : integration.state === "active" ? "secondary" : "outline"}>{integration.state}</Badge></div>) : <p className="py-3 text-sm text-muted-foreground">No CRM or SIS connections registered yet.</p>}
            </div>
          </div>
          <div className="card-surface mt-6 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">AI concierge review queue</h3><p className="mt-1 text-sm text-muted-foreground">The concierge can suggest opportunities, introductions, events, and chapters, but it cannot act or publish without staff approval.</p></div><Badge variant="secondary">{aiReviewQueue.data?.length ?? 0} awaiting review</Badge></div>
            <div className="mt-4 space-y-3">
              {aiReviewQueue.isLoading ? <RowsSkeleton count={2} /> : aiReviewQueue.data?.length ? aiReviewQueue.data.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3"><div className="min-w-0 flex-1"><p className="text-sm font-medium capitalize">{item.recommendation_type} recommendation</p><p className="mt-1 text-sm text-muted-foreground">{item.rationale}</p><p className="mt-1 text-xs text-muted-foreground">Member reference {item.profile_id.slice(0, 8)} · submitted {formatDate(item.created_at)}</p></div><Button size="sm" disabled={reviewAiRecommendation.isPending} onClick={() => reviewAiRecommendation.mutate({ id: item.id, status: "approved" })}>Approve</Button><Button size="sm" variant="ghost" disabled={reviewAiRecommendation.isPending} onClick={() => reviewAiRecommendation.mutate({ id: item.id, status: "rejected" })}>Reject</Button></div>) : <p className="py-3 text-sm text-muted-foreground">No AI recommendations are awaiting review.</p>}
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
                  <Button
                    size="sm"
                    onClick={() => setStatus.mutate({ id: p.id, status: "verified" })}
                  >
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
              <div
                key={j.id}
                className="card-surface flex flex-wrap items-center justify-between gap-3 p-5"
              >
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
