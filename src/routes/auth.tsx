import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or join — AlumniConnect" },
      {
        name: "description",
        content:
          "Create your alumni account with your graduation year and degree program, or sign in to your existing profile.",
      },
      { property: "og:title", content: "Join the AlumniConnect network" },
      {
        property: "og:description",
        content: "Verified alumni profiles, jobs, mentorship and events for your university.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/profile", replace: true });
  }, [session, navigate]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/profile" });
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: String(form.get("password")),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    if (data.session?.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: data.session.user.id,
        full_name: String(form.get("full_name")),
        email,
        degree: String(form.get("degree")),
        grad_year: Number(form.get("grad_year")),
        is_student: form.get("kind") === "student",
      });
      setLoading(false);
      if (profileError) {
        toast.error(profileError.message);
        return;
      }
      toast.success("Account created — your profile is awaiting verification");
      navigate({ to: "/profile" });
      return;
    }

    setLoading(false);
    toast.success("Check your email to confirm your account, then sign in.");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="mb-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="size-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Welcome to AlumniConnect</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Alumni and students of the university. Verification usually takes a day.
        </p>
      </div>

      <Tabs defaultValue="signin" className="card-surface p-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Create account</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form onSubmit={signIn} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="si-email">Email</Label>
              <Input id="si-email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="si-password">Password</Label>
              <Input
                id="si-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={signUp} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="su-name">Full name</Label>
              <Input id="su-name" name="full_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-email">Email</Label>
              <Input id="su-email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-password">Password</Label>
              <Input
                id="su-password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="su-degree">Degree program</Label>
                <Input id="su-degree" name="degree" required placeholder="BSc Economics" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-year">Graduation year</Label>
                <Input
                  id="su-year"
                  name="grad_year"
                  type="number"
                  required
                  min={1950}
                  max={2035}
                  placeholder="2019"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-kind">I am a</Label>
              <select
                id="su-kind"
                name="kind"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="alumni">Alumnus / alumna</option>
                <option value="student">Current student</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
