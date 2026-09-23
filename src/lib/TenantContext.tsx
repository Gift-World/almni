import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  theme_color: string;
  logo_url: string | null;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  setTenantSlug: (slug: string) => void;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  setTenantSlug: () => {},
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  // In a real production app, we would derive the slug from window.location.hostname
  // For this local environment, we'll read from localStorage or default to 'default'
  const loadTenant = async (slug: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!error && data) {
      setTenant(data as Tenant);
      localStorage.setItem("alumniconnect_tenant", slug);
      
      // Update CSS variables for theme color
      if (data.theme_color) {
        document.documentElement.style.setProperty("--primary", data.theme_color);
      } else {
        document.documentElement.style.removeProperty("--primary");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const savedSlug = localStorage.getItem("alumniconnect_tenant") || "default";
    loadTenant(savedSlug);
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, loading, setTenantSlug: loadTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
