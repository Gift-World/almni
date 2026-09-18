import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Building2, MapPin, Plus, Search, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { RowsSkeleton } from "@/components/CardSkeletons";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Alumni job board — AlumniConnect" },
      {
        name: "description",
        content:
          "Roles posted by alumni at their own companies. Filter by industry, location and remote or onsite, then express interest in one click.",
      },
      { property: "og:title", content: "Alumni job board — AlumniConnect" },
      {
        property: "og:description",
        content: "Openings shared by alumni, with a warm introduction built in.",
      },
    ],
  }),
  component: JobsPage,
});

const ALL = "__all__";

function JobsPage() {
  const { profile, session } = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState(ALL);
  const [mode, setMode] = useState(ALL);
  const [postOpen, setPostOpen] = useState(false);

  const jobs = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, poster:profiles!jobs_posted_by_fkey(id, full_name, avatar_url)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const myApplications = useQuery({
    queryKey: ["my-applications", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("job_applications")
        .select("job_id")
        .eq("applicant_id", profile!.id);
      return (data ?? []).map((r) => r.job_id);
    },
  });

  const apply = useMutation({
    mutationFn: async (jobId: string) => {
      if (!profile) throw new Error("Create your profile first");
      const { error } = await supabase
        .from("job_applications")
        .insert({ job_id: jobId, applicant_id: profile.id, note: "Interested via AlumniConnect" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Interest sent to the poster");
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const postJob = useMutation({
    mutationFn: async (form: FormData) => {
      if (!profile) throw new Error("Create your profile first");
      const { error } = await supabase.from("jobs").insert({
        posted_by: profile.id,
        title: String(form.get("title")),
        company: String(form.get("company")),
        location: String(form.get("location")),
        industry: String(form.get("industry")),
        work_mode: String(form.get("work_mode")),
        employment_type: String(form.get("employment_type")),
        salary_range: String(form.get("salary_range")) || null,
        description: String(form.get("description")),
        apply_url: String(form.get("apply_url")) || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job posted");
      setPostOpen(false);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const industries = useMemo(
    () => [...new Set((jobs.data ?? []).map((j) => j.industry).filter(Boolean) as string[])].sort(),
    [jobs.data],
  );

  const results = (jobs.data ?? []).filter((j) => {
    const hay = `${j.title} ${j.company} ${j.location} ${j.description}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (industry !== ALL && j.industry !== industry) return false;
    if (mode !== ALL && j.work_mode !== mode) return false;
    return true;
  });

  return (
    <PageShell
      title="Job board"
      subtitle="Every role here was posted by an alumnus at their own company."
      action={
        session ? (
          <Button onClick={() => setPostOpen(true)}>
            <Plus className="size-4" /> Post a role
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to="/auth">Sign in to post</Link>
          </Button>
        )
      }
    >
      <div className="card-surface mb-6 grid gap-3 p-4 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Role, company, keyword…"
            className="pl-9"
          />
        </div>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger>
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All industries</SelectItem>
            {industries.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger>
            <SelectValue placeholder="Work mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Remote or onsite</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="onsite">Onsite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {jobs.isLoading ? (
        <RowsSkeleton />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No roles match your filters"
          description="Clear a filter, or check back soon — alumni post new openings every week."
        />
      ) : (
        <div className="space-y-3">
          {results.map((job) => {
            const applied = myApplications.data?.includes(job.id);
            return (
              <article key={job.id} className="card-surface card-interactive p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">{job.title}</h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="size-3.5" /> {job.company}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5" /> {job.location}
                      </span>
                      <span>Posted {formatDate(job.created_at)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {session ? (
                      <Button
                        size="sm"
                        variant={applied ? "secondary" : "default"}
                        disabled={applied || apply.isPending}
                        onClick={() => apply.mutate(job.id)}
                      >
                        <Send className="size-4" /> {applied ? "Interest sent" : "Express interest"}
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="outline">
                        <Link to="/auth">Sign in to apply</Link>
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="capitalize">
                    {job.work_mode}
                  </Badge>
                  <Badge variant="secondary">{job.employment_type}</Badge>
                  {job.industry ? <Badge variant="secondary">{job.industry}</Badge> : null}
                  {job.salary_range ? <Badge variant="outline">{job.salary_range}</Badge> : null}
                  {job.poster ? (
                    <Badge variant="outline" className="font-normal">
                      Posted by {job.poster.full_name}
                    </Badge>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post a role at your company</DialogTitle>
            <DialogDescription>
              Alumni-posted roles get far more applications. Keep the description honest and short.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              postJob.mutate(new FormData(e.currentTarget));
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <Field name="title" label="Job title" required />
              <Field name="company" label="Company" required />
              <Field name="location" label="Location" required />
              <Field name="industry" label="Industry" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="work_mode">Work mode</Label>
                <select
                  id="work_mode"
                  name="work_mode"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="onsite">Onsite</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
              <Field name="employment_type" label="Type" defaultValue="Full-time" />
            </div>
            <Field name="salary_range" label="Salary range (optional)" />
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={5} required />
            </div>
            <Field name="apply_url" label="Application link (optional)" />
            <Button type="submit" className="w-full" disabled={postJob.isPending}>
              Publish role
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Field({
  name,
  label,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required={required} defaultValue={defaultValue} />
    </div>
  );
}
