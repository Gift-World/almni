import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search, UserPlus, Users, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AlumniCard } from "@/components/AlumniCard";
import { CardGridSkeleton } from "@/components/CardSkeletons";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/alumni/")({
  head: () => ({
    meta: [
      { title: "Alumni directory — AlumniConnect" },
      {
        name: "description",
        content:
          "Search and filter verified alumni by graduation year, industry, location, company and skills, then connect in one click.",
      },
      { property: "og:title", content: "Alumni directory — AlumniConnect" },
      {
        property: "og:description",
        content: "Find classmates and alumni by year, industry, city, company or skill.",
      },
    ],
  }),
  component: Directory,
});

const ALL = "__all__";

function Directory() {
  const { profile, session } = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [year, setYear] = useState(ALL);
  const [industry, setIndustry] = useState(ALL);
  const [location, setLocation] = useState(ALL);

  const { data, isLoading } = useQuery({
    queryKey: ["directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("status", "verified")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const connect = useMutation({
    mutationFn: async (addresseeId: string) => {
      if (!profile) throw new Error("Complete your profile first");
      const { error } = await supabase
        .from("connections")
        .insert({ requester_id: profile.id, addressee_id: addresseeId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Connection request sent");
      queryClient.invalidateQueries({ queryKey: ["my-connections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const options = useMemo(() => {
    const years = new Set<string>();
    const industries = new Set<string>();
    const locations = new Set<string>();
    (data ?? []).forEach((p) => {
      if (p.grad_year) years.add(String(p.grad_year));
      if (p.industry) industries.add(p.industry);
      if (p.location) locations.add(p.location);
    });
    return {
      years: [...years].sort().reverse(),
      industries: [...industries].sort(),
      locations: [...locations].sort(),
    };
  }, [data]);

  const results = (data ?? []).filter((p) => {
    const haystack = [p.full_name, p.company, p.job_title, p.location, p.degree, ...p.skills]
      .join(" ")
      .toLowerCase();
    if (q && !haystack.includes(q.toLowerCase())) return false;
    if (year !== ALL && String(p.grad_year) !== year) return false;
    if (industry !== ALL && p.industry !== industry) return false;
    if (location !== ALL && p.location !== location) return false;
    return true;
  });

  const suggestedConnections = useMemo(() => {
    if (!profile || !data) return [];
    // Smart matching heuristic: same industry or same country (if not the default country)
    return data
      .filter((p) => p.id !== profile.id)
      .filter((p) => {
        const anyP = p as any;
        const sameIndustry = p.industry && p.industry === profile.industry;
        const isExpat = anyP.country && anyP.country !== 'United States' && anyP.country === (profile as any).country;
        return sameIndustry || isExpat;
      })
      .slice(0, 3);
  }, [profile, data]);

  return (
    <PageShell
      title="Alumni directory"
      subtitle={`${data?.length ?? 0} verified alumni and students. Filter by year, industry, city or skill.`}
    >
      <div className="card-surface mb-6 grid gap-3 p-4 md:grid-cols-4">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, company, skill…"
            className="pl-9"
          />
        </div>
        <FilterSelect label="Graduation year" value={year} onChange={setYear} options={options.years} />
        <FilterSelect label="Industry" value={industry} onChange={setIndustry} options={options.industries} />
        <FilterSelect label="Location" value={location} onChange={setLocation} options={options.locations} />
      </div>

      {!isLoading && suggestedConnections.length > 0 && q === "" && year === ALL && industry === ALL && location === ALL && (
        <div className="mb-8 rounded-xl border bg-card/50 p-6">
          <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="size-5 text-primary" />
            Suggested Connections
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Alumni we think you'd like to meet based on your industry and global location.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedConnections.map((p) => (
              <AlumniCard
                key={`suggested-${p.id}`}
                profile={p}
                action={
                  <Button
                    size="sm"
                    onClick={() => connect.mutate(p.id)}
                    disabled={connect.isPending}
                  >
                    <UserPlus className="size-4" /> Connect
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <CardGridSkeleton />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No alumni match those filters"
          description="Try widening your search — clear a filter or search a broader term."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQ("");
                setYear(ALL);
                setIndustry(ALL);
                setLocation(ALL);
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <AlumniCard
              key={p.id}
              profile={p}
              action={
                session && profile?.id !== p.id ? (
                  <Button
                    size="sm"
                    onClick={() => connect.mutate(p.id)}
                    disabled={connect.isPending}
                    aria-label={`Connect with ${p.full_name}`}
                  >
                    <UserPlus className="size-4" /> Connect
                  </Button>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label.toLowerCase()}s</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
