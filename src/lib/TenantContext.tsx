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
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
});

function tenantSlugFromHost(hostname: string) {
  const parts = hostname.split(".");
  // Local development and a bare production domain use the default tenant.
  // Hosted university instances use a subdomain, e.g. northbridge.example.com.
  return hostname === "localhost" || parts.length < 3 ? "default" : (parts[0] ?? "default");
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTenant = async (slug: string) => {
    setLoading(true);
    const { data, error } = await supabase.from("tenants").select("*").eq("slug", slug).single();

    if (!error && data) {
      setTenant(data as Tenant);
      // Update CSS variables for theme color
      if (data.theme_color) {
        document.documentElement.style.setProperty("--primary", data.theme_color);
      } else {
        document.documentElement.style.removeProperty("--primary");
      }
    } else {
      setTenant(null);
      document.documentElement.style.removeProperty("--primary");
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadTenant(tenantSlugFromHost(window.location.hostname));
  }, []);

  return <TenantContext.Provider value={{ tenant, loading }}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
