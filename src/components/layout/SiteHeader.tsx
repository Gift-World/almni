import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Menu, Moon, Sun, BadgeCheck, Building2, UserRound } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import { useTenant } from "@/lib/TenantContext";
import { useWorkspace } from "@/lib/workspace";

const NAV = [
  { to: "/alumni", label: "Directory" },
  { to: "/businesses", label: "Businesses" },
  { to: "/feed", label: "Feed" },
  { to: "/map", label: "Map" },
  { to: "/chapters", label: "Chapters" },
  { to: "/jobs", label: "Jobs" },
  { to: "/mentorship", label: "Mentorship" },
  { to: "/events", label: "Events" },
  { to: "/giving", label: "Giving" },
] as const;

const STAFF_NAV = [{ to: "/admin", label: "Command center" }] as const;

export function SiteHeader() {
  const { session, profile, isAdmin } = useAuth();
  const { theme, toggle } = useTheme();
  const { tenant } = useTenant();
  const { mode, setMode } = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md px-2 font-display text-lg font-bold transition-colors hover:bg-secondary"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          {tenant?.name || "AlumniConnect"}
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {(mode === "staff"
            ? STAFF_NAV
            : session
              ? [{ to: "/nexus" as const, label: "Nexus" }, ...NAV]
              : NAV
          ).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="size-9">
                    <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
                    <AvatarFallback>
                      {initials(profile?.full_name ?? session.user.email ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-medium">
                    {profile?.full_name ?? session.user.email}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    {profile?.status === "verified" ? (
                      <>
                        <BadgeCheck className="size-3 text-primary" /> Verified alumni
                      </>
                    ) : (
                      "Awaiting verification"
                    )}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">My profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/requests">Connections</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/messages">Direct Messages</Link>
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      setMode(mode === "staff" ? "member" : "staff");
                      if (mode !== "staff") navigate({ to: "/admin" });
                    }}
                  >
                    {mode === "staff" ? (
                      <>
                        <UserRound className="mr-2 size-4" /> Switch to alumni view
                      </>
                    ) : (
                      <>
                        <Building2 className="mr-2 size-4" /> Switch to staff workspace
                      </>
                    )}
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={signOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-6">
              <nav className="mt-8 flex flex-col gap-1">
                {(mode === "staff"
                  ? STAFF_NAV
                  : session
                    ? [{ to: "/nexus" as const, label: "Nexus" }, ...NAV]
                    : NAV
                ).map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                    activeProps={{ className: "bg-secondary text-foreground" }}
                  >
                    {item.label}
                  </Link>
                ))}
                {!session ? (
                  <Button asChild className="mt-4">
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
