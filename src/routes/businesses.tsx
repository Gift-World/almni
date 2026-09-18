import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Store, MapPin, Globe } from "lucide-react";
import { useMemo, useState } from "react";

import { CardGridSkeleton } from "@/components/CardSkeletons";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/businesses")({
  component: Businesses,
});

function Businesses() {
  const [q, setQ] = useState("");
  const [internationalOnly, setInternationalOnly] = useState(false);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select(`*, owner:profiles(full_name, avatar_url)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const results = useMemo(() => {
    return (businesses ?? []).filter((b) => {
      const haystack = `${b.name} ${b.description} ${b.industry} ${b.location} ${b.country}`.toLowerCase();
      if (q && !haystack.includes(q.toLowerCase())) return false;
      if (internationalOnly && b.country === "United States") return false;
      return true;
    });
  }, [businesses, q, internationalOnly]);

  return (
    <PageShell
      title="Alumni Directory"
      subtitle="Support businesses and services owned by fellow alumni around the globe."
    >
      <div className="card-surface mb-6 flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search businesses, industries..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="international"
            checked={internationalOnly}
            onCheckedChange={setInternationalOnly}
          />
          <Label htmlFor="international" className="flex items-center gap-1 cursor-pointer">
            <Globe className="size-4" /> International Only
          </Label>
        </div>
      </div>

      {isLoading ? (
        <CardGridSkeleton />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No businesses found"
          description="Try adjusting your search filters."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQ("");
                setInternationalOnly(false);
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((b) => (
            <article key={b.id} className="card-surface card-interactive flex flex-col p-5">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{b.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="font-normal">{b.industry}</Badge>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> {b.location}, {b.country}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {b.description}
                </p>
              </div>
              <div className="mt-4 border-t pt-4">
                {b.discount_code && (
                  <div className="mb-3 rounded-md border border-primary/20 bg-primary/5 p-2 text-center text-sm">
                    <span className="font-medium text-primary">Alumni Code:</span> {b.discount_code}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Owned by {(b.owner as any)?.full_name}
                  </div>
                  {b.website && (
                    <Button asChild size="sm" variant="outline">
                      <a href={b.website} target="_blank" rel="noreferrer">Visit Site</a>
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
