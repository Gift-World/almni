import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import React, { useMemo, Suspense } from "react";
import { Users, Globe } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";

const ClientMap = React.lazy(() => import("@/components/ClientMap"));

export const Route = createFileRoute("/map")({
  component: GlobalMap,
});

// Extremely simple geocoder fallback since we don't have lat/lng in DB
const LOCATION_COORDS: Record<string, [number, number]> = {
  "San Francisco, CA": [37.7749, -122.4194],
  "New York, NY": [40.7128, -74.0060],
  "London": [51.5074, -0.1278],
  "Lagos": [6.5244, 3.3792],
  "Toronto, ON": [43.6510, -79.3470],
  "Berlin": [52.5200, 13.4050],
  "Singapore": [1.3521, 103.8198],
  "Sydney": [-33.8688, 151.2093],
};

function GlobalMap() {
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["map_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, location, country, industry, job_title, company")
        .eq("status", "verified")
        .not("location", "is", null);
      if (error) throw error;
      return data;
    },
  });

  const markers = useMemo(() => {
    if (!profiles) return [];
    
    return profiles.map((p) => {
      // Very basic mock geocoding logic for MVP. 
      // In a real app, lat/lng would be stored in the DB using PostGIS or populated via Geocoding API on profile update.
      let coords = LOCATION_COORDS[p.location as string];
      
      // If we don't have exact coords, spread them around slightly so they don't all stack on [0,0]
      if (!coords) {
        // Pseudo-random based on id string length just for visuals
        const offsetLat = (p.id.length % 100) * 0.1 - 5;
        const offsetLng = (p.id.charCodeAt(0) % 100) * 0.1 - 5;
        
        // Default country approximations
        if (p.country === 'Nigeria') coords = [9.0820 + offsetLat, 8.6753 + offsetLng];
        else if (p.country === 'United Kingdom') coords = [55.3781 + offsetLat, -3.4360 + offsetLng];
        else if (p.country === 'Canada') coords = [56.1304 + offsetLat, -106.3468 + offsetLng];
        else coords = [39.8283 + offsetLat, -98.5795 + offsetLng]; // US Default
      }

      // Add small jitter to prevent exact overlapping
      const jitterLat = (Math.random() - 0.5) * 0.02;
      const jitterLng = (Math.random() - 0.5) * 0.02;

      return {
        ...p,
        lat: coords[0] + jitterLat,
        lng: coords[1] + jitterLng,
      };
    });
  }, [profiles]);

  return (
    <PageShell
      title="Global Map"
      subtitle="Discover alumni around the world and find local chapters."
    >
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="card-surface flex items-center gap-4 rounded-xl p-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Globe className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{markers.length}</div>
            <div className="text-xs text-muted-foreground">Mapped Alumni</div>
          </div>
        </div>
        <div className="card-surface flex items-center gap-4 rounded-xl p-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {new Set(markers.map((m) => m.country)).size}
            </div>
            <div className="text-xs text-muted-foreground">Countries Represented</div>
          </div>
        </div>
      </div>

      <div className="card-surface overflow-hidden rounded-xl border" style={{ height: "600px" }}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center bg-muted/20">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <Suspense fallback={
            <div className="flex h-full items-center justify-center bg-muted/20">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          }>
            {typeof window !== "undefined" && <ClientMap markers={markers} />}
          </Suspense>
        )}
      </div>
    </PageShell>
  );
}
